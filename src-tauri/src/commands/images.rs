use crate::utils::paths::{get_output_dir};
use crate::utils::validation::validate_pdf;
use lopdf::{Document, Object};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use image::{DynamicImage, RgbImage, ImageFormat};

#[derive(Serialize)]
pub struct ExtractImagesResult {
    pub output_dir: String,
    pub images_extracted: usize,
}

#[tauri::command]
pub async fn extract_pdf_images(
    app: tauri::AppHandle,
    input_path: String,
    output_folder_name: Option<String>,
) -> Result<ExtractImagesResult, String> {
    validate_pdf(&input_path)?;

    let doc = Document::load(&input_path).map_err(|e| format!("Failed to load PDF: {}", e))?;
    
    let base_out_dir = get_output_dir(&app)?;
    let folder_name = match output_folder_name {
        Some(name) if !name.trim().is_empty() => name,
        _ => {
            let input_path_buf = PathBuf::from(&input_path);
            let stem = input_path_buf.file_stem().unwrap_or_default().to_string_lossy();
            format!("{}_images", stem)
        }
    };
    
    let output_dir = base_out_dir.join(&folder_name);
    
    if !output_dir.exists() {
        fs::create_dir_all(&output_dir).map_err(|e| format!("Failed to create output directory: {}", e))?;
    }

    let mut images_extracted = 0;

    for (page_number, page_id) in doc.get_pages() {
        if let Ok(resources) = doc.get_object(page_id).and_then(|o| o.as_dict())
            .and_then(|d| d.get(b"Resources")).and_then(|o| match o {
                Object::Dictionary(d) => Ok(d.clone()),
                Object::Reference(id) => doc.get_object(*id).and_then(|o| o.as_dict()).map(|d| d.clone()),
                _ => Err(lopdf::Error::Type),
            }) 
        {
            if let Ok(xobjects) = resources.get(b"XObject").and_then(|o| match o {
                Object::Dictionary(d) => Ok(d.clone()),
                Object::Reference(id) => doc.get_object(*id).and_then(|o| o.as_dict()).map(|d| d.clone()),
                _ => Err(lopdf::Error::Type),
            }) {
                for (name, obj_ref) in xobjects.iter() {
                    if let Ok(xobj_id) = obj_ref.as_reference() {
                        if let Ok(Object::Stream(stream)) = doc.get_object(xobj_id) {
                            if let Ok(subtype) = stream.dict.get(b"Subtype").and_then(|o| o.as_name()) {
                                if subtype == b"Image" {
                                    images_extracted += 1;
                                    let filter = stream.dict.get(b"Filter").and_then(|o| match o {
                                        Object::Name(n) => Ok(vec![n.clone()]),
                                        Object::Array(a) => {
                                            let mut filters = Vec::new();
                                            for item in a {
                                                if let Ok(n) = item.as_name() {
                                                    filters.push(n.to_vec());
                                                }
                                            }
                                            Ok(filters)
                                        },
                                        _ => Err(lopdf::Error::Type)
                                    }).unwrap_or_default();
                                    
                                    let is_jpeg = filter.iter().any(|f| f == b"DCTDecode");
                                    
                                    if is_jpeg {
                                        let img_path = output_dir.join(format!("page_{}_{}.jpg", page_number, String::from_utf8_lossy(name)));
                                        let _ = fs::write(&img_path, &stream.content);
                                    } else {
                                        // Try decoding the stream content
                                        let decoded_content = stream.decompressed_content().unwrap_or(stream.content.clone());
                                        let width = stream.dict.get(b"Width").and_then(|o| o.as_i64()).unwrap_or(0) as u32;
                                        let height = stream.dict.get(b"Height").and_then(|o| o.as_i64()).unwrap_or(0) as u32;
                                        let color_space = stream.dict.get(b"ColorSpace").and_then(|o| o.as_name()).unwrap_or(b"DeviceRGB");
                                        let bits_per_component = stream.dict.get(b"BitsPerComponent").and_then(|o| o.as_i64()).unwrap_or(8) as u32;

                                        if width > 0 && height > 0 && bits_per_component == 8 {
                                            if color_space == b"DeviceRGB" && decoded_content.len() >= (width * height * 3) as usize {
                                                if let Some(rgb_image) = RgbImage::from_raw(width, height, decoded_content) {
                                                    let img_path = output_dir.join(format!("page_{}_{}.png", page_number, String::from_utf8_lossy(name)));
                                                    let dyn_img = DynamicImage::ImageRgb8(rgb_image);
                                                    let _ = dyn_img.save_with_format(img_path, ImageFormat::Png);
                                                }
                                            } else if color_space == b"DeviceGray" && decoded_content.len() >= (width * height) as usize {
                                                if let Some(gray_image) = image::GrayImage::from_raw(width, height, decoded_content) {
                                                    let img_path = output_dir.join(format!("page_{}_{}.png", page_number, String::from_utf8_lossy(name)));
                                                    let dyn_img = DynamicImage::ImageLuma8(gray_image);
                                                    let _ = dyn_img.save_with_format(img_path, ImageFormat::Png);
                                                }
                                            } else if color_space == b"DeviceCMYK" && decoded_content.len() >= (width * height * 4) as usize {
                                                // Minimal CMYK to RGB conversion
                                                let mut rgb_data = Vec::with_capacity((width * height * 3) as usize);
                                                for i in 0..(width * height) as usize {
                                                    let c = decoded_content[i * 4] as f32 / 255.0;
                                                    let m = decoded_content[i * 4 + 1] as f32 / 255.0;
                                                    let y = decoded_content[i * 4 + 2] as f32 / 255.0;
                                                    let k = decoded_content[i * 4 + 3] as f32 / 255.0;

                                                    let r = 255.0 * (1.0 - c) * (1.0 - k);
                                                    let g = 255.0 * (1.0 - m) * (1.0 - k);
                                                    let b = 255.0 * (1.0 - y) * (1.0 - k);

                                                    rgb_data.push(r as u8);
                                                    rgb_data.push(g as u8);
                                                    rgb_data.push(b as u8);
                                                }
                                                if let Some(rgb_image) = RgbImage::from_raw(width, height, rgb_data) {
                                                    let img_path = output_dir.join(format!("page_{}_{}.png", page_number, String::from_utf8_lossy(name)));
                                                    let dyn_img = DynamicImage::ImageRgb8(rgb_image);
                                                    let _ = dyn_img.save_with_format(img_path, ImageFormat::Png);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(ExtractImagesResult {
        output_dir: output_dir.to_string_lossy().to_string(),
        images_extracted,
    })
}