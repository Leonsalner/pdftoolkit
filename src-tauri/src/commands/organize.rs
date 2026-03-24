use std::collections::HashMap;
use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};

use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use lopdf::Document;
use serde::Serialize;
use tauri_plugin_shell::ShellExt;

use crate::utils::paths::{get_output_dir, output_filename};
use crate::utils::validation::validate_pdf;

#[derive(Serialize)]
pub struct ThumbnailData {
    pub page_number: u32,
    pub data: String,
}

#[derive(Serialize)]
pub struct OrganizeResult {
    pub output_path: String,
    pub pages_written: u32,
}

#[tauri::command]
pub async fn generate_page_thumbnails(
    app: tauri::AppHandle,
    input_path: String,
    page_numbers: Vec<u32>,
    _max_width: u32,
) -> Result<Vec<ThumbnailData>, String> {
    validate_pdf(&input_path)?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let temp_dir = std::env::temp_dir().join(format!("pdf_toolkit_thumbs_{}", timestamp));

    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temp directory: {}", e))?;

    let mut thumbnails = Vec::new();

    for page_num in &page_numbers {
        let output_file = temp_dir.join(format!("page_{}.png", page_num));
        let _output_str = output_file.to_string_lossy().to_string();

        let output = app
            .shell()
            .sidecar("gs")
            .map_err(|e| format!("Failed to initialize Ghostscript sidecar: {}", e))?
            .args([
                "-dNOPAUSE",
                "-dBATCH",
                "-dQUIET",
                "-sDEVICE=png16m",
                "-r72",
                "-dFirstPage",
                &page_num.to_string(),
                "-dLastPage",
                &page_num.to_string(),
                "-dFitPage",
                "-sOutputFile=&output_str",
                &input_path,
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to execute Ghostscript: {}", e))?;

        if !output.status.success() {
            let _ = fs::remove_dir_all(&temp_dir);
            return Err(format!(
                "Ghostscript failed for page {}",
                page_num
            ));
        }

        if output_file.exists() {
            let bytes = fs::read(&output_file)
                .map_err(|e| format!("Failed to read thumbnail: {}", e))?;
            let b64_data = BASE64_STANDARD.encode(&bytes);
            thumbnails.push(ThumbnailData {
                page_number: *page_num,
                data: b64_data,
            });
        }
    }

    let _ = fs::remove_dir_all(&temp_dir);

    thumbnails.sort_by_key(|t| t.page_number);
    Ok(thumbnails)
}

#[tauri::command]
pub async fn save_organized_pdf(
    app: tauri::AppHandle,
    input_path: String,
    page_order: Vec<u32>,
    rotations: HashMap<String, i32>,
    output_name: Option<String>,
    absolute_output_path: Option<String>,
) -> Result<OrganizeResult, String> {
    validate_pdf(&input_path)?;
    let mut doc = Document::load(&input_path)
        .map_err(|e| format!("Failed to read PDF: {}", e))?;

    let page_map = doc.get_pages();

    for (page_str, rotation) in &rotations {
        if *rotation == 0 {
            continue;
        }
        if let Ok(page_num) = page_str.parse::<u32>() {
            if let Some(&obj_id) = page_map.get(&page_num) {
                if let Ok(obj) = doc.get_object_mut(obj_id) {
                    if let lopdf::Object::Dictionary(ref mut dict) = obj {
                        let current = dict.get(b"Rotate").ok()
                            .and_then(|r| r.as_i64().ok())
                            .unwrap_or(0) as i32;
                        let delta = *rotation;
                        let new_rotation = ((current + delta) % 360 + 360) % 360;
                        let _ = dict.set("Rotate", lopdf::Object::Integer(new_rotation as i64));
                    }
                }
            }
        }
    }

    let page_order_ids: Vec<lopdf::ObjectId> = page_order
        .iter()
        .filter_map(|p| page_map.get(p).copied())
        .collect();

    if let Ok(root_id) = doc.trailer.get(b"Root").and_then(|r| r.as_reference()) {
        if let Ok(root_obj) = doc.get_object_mut(root_id) {
            if let lopdf::Object::Dictionary(ref mut dict) = root_obj {
                let _ = dict.set("Kids", lopdf::Object::Array(
                    page_order_ids.iter().map(|id| lopdf::Object::Reference(*id)).collect()
                ));
                let _ = dict.set("Count", lopdf::Object::Integer(page_order.len() as i64));
            }
        }
    }

    let output_path = if let Some(abs_path) = absolute_output_path {
        std::path::PathBuf::from(abs_path)
    } else {
        let out_dir = get_output_dir(&app)?;
        let file_name = match output_name {
            Some(name) if !name.trim().is_empty() => {
                if name.to_lowercase().ends_with(".pdf") {
                    name
                } else {
                    format!("{}.pdf", name)
                }
            }
            _ => output_filename(&input_path, "organized"),
        };
        out_dir.join(file_name)
    };

    if output_path.exists() {
        return Err("Output file already exists. Please choose a different name or location.".to_string());
    }

    let output_str = output_path.to_string_lossy().to_string();

    doc.save(&output_path)
        .map_err(|e| format!("Failed to write output: {}", e))?;

    Ok(OrganizeResult {
        output_path: output_str,
        pages_written: page_order.len() as u32,
    })
}
