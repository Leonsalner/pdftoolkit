use crate::utils::paths::{get_output_dir, output_filename};
use crate::utils::validation::validate_pdf;
use lopdf::{
    content::{Content, Operation},
    Dictionary, Document, Object, Stream,
};
use serde::Serialize;

#[derive(Serialize)]
pub struct WatermarkResult {
    pub output_path: String,
    pub pages_watermarked: u32,
}

#[tauri::command]
pub async fn add_text_watermark(
    app: tauri::AppHandle,
    input_path: String,
    text: String,
    pages: Option<String>,
    font_size: f32,
    _opacity: f32,
    rotation: f32,
    color: (f32, f32, f32),
    output_name: Option<String>,
) -> Result<WatermarkResult, String> {
    validate_pdf(&input_path)?;

    let mut doc = Document::load(&input_path).map_err(|e| format!("Failed to load PDF: {}", e))?;

    let total_pages = doc.get_pages().len() as u32;
    let target_pages: Vec<u32> = if let Some(p) = pages {
        if p == "all" {
            (1..=total_pages).collect()
        } else {
            p.split(',')
                .filter_map(|s| s.trim().parse::<u32>().ok())
                .filter(|&page| page >= 1 && page <= total_pages)
                .collect()
        }
    } else {
        (1..=total_pages).collect()
    };

    if target_pages.is_empty() {
        return Err("No valid pages selected for watermarking".to_string());
    }

    let font_id = doc.add_object(Dictionary::from_iter(vec![
        ("Type", Object::Name(b"Font".to_vec())),
        ("Subtype", Object::Name(b"Type1".to_vec())),
        ("BaseFont", Object::Name(b"Helvetica-Bold".to_vec())),
    ]));

    for page_num in target_pages.clone() {
        let (width, height, resources_id_opt) = {
            let page_id = *doc
                .get_pages()
                .get(&(page_num as u32))
                .ok_or("Page missing")?;
            let page_dict = doc
                .objects
                .get(&page_id)
                .and_then(|o| o.as_dict().ok())
                .ok_or("Failed to get page dict")?;

            let mut w = 612.0;
            let mut h = 792.0;
            if let Ok(media_box) = page_dict.get(b"MediaBox") {
                if let Ok(arr) = media_box.as_array() {
                    if arr.len() == 4 {
                        w = arr[2]
                            .as_float()
                            .or_else(|_| arr[2].as_i64().map(|v| v as f32))
                            .unwrap_or(612.0);
                        h = arr[3]
                            .as_float()
                            .or_else(|_| arr[3].as_i64().map(|v| v as f32))
                            .unwrap_or(792.0);
                    }
                }
            }

            let res_id = page_dict
                .get(b"Resources")
                .ok()
                .and_then(|obj| obj.as_reference().ok());
            (w, h, res_id)
        };

        let content = Content {
            operations: vec![
                Operation::new("q", vec![]),
                Operation::new(
                    "rg",
                    vec![
                        Object::Real(color.0),
                        Object::Real(color.1),
                        Object::Real(color.2),
                    ],
                ),
                Operation::new("BT", vec![]),
                Operation::new(
                    "Tf",
                    vec![Object::Name(b"F_PDFTK_WM".to_vec()), Object::Real(font_size)],
                ),
                {
                    let rad = rotation.to_radians();
                    let cos_a = rad.cos();
                    let sin_a = rad.sin();
                    Operation::new(
                        "Tm",
                        vec![
                            Object::Real(cos_a),
                            Object::Real(sin_a),
                            Object::Real(-sin_a),
                            Object::Real(cos_a),
                            Object::Real(width / 2.0),
                            Object::Real(height / 2.0),
                        ],
                    )
                },
                Operation::new(
                    "Td",
                    vec![
                        Object::Real(-(text.len() as f32 * font_size * 0.3)),
                        Object::Real(0.0),
                    ],
                ),
                Operation::new(
                    "Tj",
                    vec![Object::String(
                        text.clone().into_bytes(),
                        lopdf::StringFormat::Literal,
                    )],
                ),
                Operation::new("ET", vec![]),
                Operation::new("Q", vec![]),
            ],
        };
        let encoded_content = content
            .encode()
            .map_err(|e| format!("Failed to encode content: {}", e))?;
        let watermark_id = doc.add_object(Stream::new(Dictionary::new(), encoded_content));

        let page_id = *doc
            .get_pages()
            .get(&(page_num as u32))
            .ok_or("Page missing")?;

        let final_resources_id = if let Some(id) = resources_id_opt {
            id
        } else {
            let id = doc.add_object(Dictionary::new());
            if let Some(Object::Dictionary(page_dict)) = doc.objects.get_mut(&page_id) {
                page_dict.set("Resources", Object::Reference(id));
            }
            id
        };

        if let Some(Object::Dictionary(res_dict)) = doc.objects.get_mut(&final_resources_id) {
            if !res_dict.has(b"Font") {
                res_dict.set("Font", Dictionary::new());
            }
            if let Ok(font_dict) = res_dict.get_mut(b"Font").and_then(|o| o.as_dict_mut()) {
                font_dict.set("F_PDFTK_WM", Object::Reference(font_id));
            }
        }

        if let Some(Object::Dictionary(page_dict)) = doc.objects.get_mut(&page_id) {
            if let Ok(contents) = page_dict.get(b"Contents") {
                if let Ok(arr) = contents.as_array() {
                    let mut new_arr = arr.clone();
                    new_arr.push(Object::Reference(watermark_id));
                    page_dict.set("Contents", Object::Array(new_arr));
                } else if let Ok(id) = contents.as_reference() {
                    page_dict.set(
                        "Contents",
                        Object::Array(vec![Object::Reference(id), Object::Reference(watermark_id)]),
                    );
                } else {
                    page_dict.set(
                        "Contents",
                        Object::Array(vec![Object::Reference(watermark_id)]),
                    );
                }
            } else {
                page_dict.set("Contents", Object::Reference(watermark_id));
            }
        }
    }

    let out_dir = get_output_dir(&app)?;
    let output_path = out_dir.join(match output_name {
        Some(name) if !name.trim().is_empty() => {
            if name.to_lowercase().ends_with(".pdf") {
                name
            } else {
                format!("{}.pdf", name)
            }
        }
        _ => output_filename(&input_path, "watermarked"),
    });

    if output_path.exists() {
        return Err("Output file already exists.".to_string());
    }

    doc.save(&output_path)
        .map_err(|e| format!("Failed to save PDF: {}", e))?;

    Ok(WatermarkResult {
        output_path: output_path.to_string_lossy().to_string(),
        pages_watermarked: target_pages.len() as u32,
    })
}

#[tauri::command]
pub async fn add_image_watermark(
    app: tauri::AppHandle,
    input_path: String,
    image_path: String,
    pages: Option<String>,
    scale: f32,
    opacity: f32,
    rotation: f32,
    output_name: Option<String>,
) -> Result<WatermarkResult, String> {
    validate_pdf(&input_path)?;

    let mut doc = Document::load(&input_path).map_err(|e| format!("Failed to load PDF: {}", e))?;

    let total_pages = doc.get_pages().len() as u32;
    let target_pages: Vec<u32> = if let Some(p) = pages {
        if p == "all" {
            (1..=total_pages).collect()
        } else {
            p.split(',')
                .filter_map(|s| s.trim().parse::<u32>().ok())
                .filter(|&page| page >= 1 && page <= total_pages)
                .collect()
        }
    } else {
        (1..=total_pages).collect()
    };

    if target_pages.is_empty() {
        return Err("No valid pages selected for watermarking".to_string());
    }

    let img = image::open(&image_path).map_err(|e| format!("Failed to load image: {}", e))?;
    let img = img.to_rgba8();
    let (img_w, img_h) = img.dimensions();

    // To use RGB without SMask in a simple way, we convert RGBA to RGB and drop alpha.
    // If the image has transparency, it won't render transparently without an SMask.
    // For simplicity, we just take RGB and rely on the global opacity.
    let mut rgb_data = Vec::with_capacity((img_w * img_h * 3) as usize);
    for pixel in img.pixels() {
        rgb_data.push(pixel[0]);
        rgb_data.push(pixel[1]);
        rgb_data.push(pixel[2]);
    }

    let mut image_dict = Dictionary::new();
    image_dict.set("Type", Object::Name(b"XObject".to_vec()));
    image_dict.set("Subtype", Object::Name(b"Image".to_vec()));
    image_dict.set("Width", img_w as i64);
    image_dict.set("Height", img_h as i64);
    image_dict.set("ColorSpace", Object::Name(b"DeviceRGB".to_vec()));
    image_dict.set("BitsPerComponent", 8);

    let mut img_stream = Stream::new(image_dict, rgb_data);
    let _ = img_stream.compress();
    let image_id = doc.add_object(img_stream);

    let mut ext_gstate = Dictionary::new();
    ext_gstate.set("Type", Object::Name(b"ExtGState".to_vec()));
    ext_gstate.set("ca", Object::Real(opacity));
    ext_gstate.set("CA", Object::Real(opacity));
    let ext_gstate_id = doc.add_object(ext_gstate);

    for page_num in target_pages.clone() {
        let (width, height, resources_id_opt) = {
            let page_id = *doc
                .get_pages()
                .get(&(page_num as u32))
                .ok_or("Page missing")?;
            let page_dict = doc
                .objects
                .get(&page_id)
                .and_then(|o| o.as_dict().ok())
                .ok_or("Failed to get page dict")?;

            let mut w = 612.0;
            let mut h = 792.0;
            if let Ok(media_box) = page_dict.get(b"MediaBox") {
                if let Ok(arr) = media_box.as_array() {
                    if arr.len() == 4 {
                        w = arr[2]
                            .as_float()
                            .or_else(|_| arr[2].as_i64().map(|v| v as f32))
                            .unwrap_or(612.0);
                        h = arr[3]
                            .as_float()
                            .or_else(|_| arr[3].as_i64().map(|v| v as f32))
                            .unwrap_or(792.0);
                    }
                }
            }

            let res_id = page_dict
                .get(b"Resources")
                .ok()
                .and_then(|obj| obj.as_reference().ok());
            (w, h, res_id)
        };

        let rad = rotation.to_radians();
        let cos_a = rad.cos();
        let sin_a = rad.sin();
        let scaled_w = img_w as f32 * scale;
        let scaled_h = img_h as f32 * scale;

        let content = Content {
            operations: vec![
                Operation::new("q", vec![]),
                Operation::new("gs", vec![Object::Name(b"GS_PDFTK_WM".to_vec())]),
                Operation::new(
                    "cm",
                    vec![
                        Object::Real(scaled_w * cos_a),
                        Object::Real(scaled_w * sin_a),
                        Object::Real(-scaled_h * sin_a),
                        Object::Real(scaled_h * cos_a),
                        Object::Real(width / 2.0 - (scaled_w * cos_a - scaled_h * sin_a) / 2.0),
                        Object::Real(height / 2.0 - (scaled_w * sin_a + scaled_h * cos_a) / 2.0),
                    ],
                ),
                Operation::new("Do", vec![Object::Name(b"Im_PDFTK_WM".to_vec())]),
                Operation::new("Q", vec![]),
            ],
        };
        
        let encoded_content = content
            .encode()
            .map_err(|e| format!("Failed to encode content: {}", e))?;
        let watermark_id = doc.add_object(Stream::new(Dictionary::new(), encoded_content));

        let page_id = *doc
            .get_pages()
            .get(&(page_num as u32))
            .ok_or("Page missing")?;

        let final_resources_id = if let Some(id) = resources_id_opt {
            id
        } else {
            let id = doc.add_object(Dictionary::new());
            if let Some(Object::Dictionary(page_dict)) = doc.objects.get_mut(&page_id) {
                page_dict.set("Resources", Object::Reference(id));
            }
            id
        };

        if let Some(Object::Dictionary(res_dict)) = doc.objects.get_mut(&final_resources_id) {
            if !res_dict.has(b"XObject") {
                res_dict.set("XObject", Dictionary::new());
            }
            if let Ok(xobj_dict) = res_dict.get_mut(b"XObject").and_then(|o| o.as_dict_mut()) {
                xobj_dict.set("Im_PDFTK_WM", Object::Reference(image_id));
            }
            
            if !res_dict.has(b"ExtGState") {
                res_dict.set("ExtGState", Dictionary::new());
            }
            if let Ok(gs_dict) = res_dict.get_mut(b"ExtGState").and_then(|o| o.as_dict_mut()) {
                gs_dict.set("GS_PDFTK_WM", Object::Reference(ext_gstate_id));
            }
        }

        if let Some(Object::Dictionary(page_dict)) = doc.objects.get_mut(&page_id) {
            if let Ok(contents) = page_dict.get(b"Contents") {
                if let Ok(arr) = contents.as_array() {
                    let mut new_arr = arr.clone();
                    new_arr.push(Object::Reference(watermark_id));
                    page_dict.set("Contents", Object::Array(new_arr));
                } else if let Ok(id) = contents.as_reference() {
                    page_dict.set(
                        "Contents",
                        Object::Array(vec![Object::Reference(id), Object::Reference(watermark_id)]),
                    );
                } else {
                    page_dict.set(
                        "Contents",
                        Object::Array(vec![Object::Reference(watermark_id)]),
                    );
                }
            } else {
                page_dict.set("Contents", Object::Reference(watermark_id));
            }
        }
    }

    let out_dir = get_output_dir(&app)?;
    let output_path = out_dir.join(match output_name {
        Some(name) if !name.trim().is_empty() => {
            if name.to_lowercase().ends_with(".pdf") {
                name
            } else {
                format!("{}.pdf", name)
            }
        }
        _ => output_filename(&input_path, "watermarked"),
    });

    if output_path.exists() {
        return Err("Output file already exists.".to_string());
    }

    doc.save(&output_path)
        .map_err(|e| format!("Failed to save PDF: {}", e))?;

    Ok(WatermarkResult {
        output_path: output_path.to_string_lossy().to_string(),
        pages_watermarked: target_pages.len() as u32,
    })
}
