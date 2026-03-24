use std::path::Path;
use serde::Serialize;
use tauri_plugin_shell::ShellExt;
use tauri::Manager;
use crate::utils::paths::get_output_dir;

#[derive(Serialize)]
pub struct OcrResult {
    pub output_path: String,
}

#[tauri::command]
pub async fn extract_text_ocr(app: tauri::AppHandle, input_path: String, output_name: Option<String>) -> Result<OcrResult, String> {
    if !Path::new(&input_path).exists() {
        return Err(format!("File not found: {}", input_path));
    }

    let out_dir = get_output_dir(&app)?;
    let base_name = match output_name {
        Some(name) if !name.trim().is_empty() => {
            let n = if name.to_lowercase().ends_with(".txt") {
                name[..name.len()-4].to_string()
            } else {
                name
            };
            n
        }
        _ => {
            let path = Path::new(&input_path);
            path.file_stem().unwrap_or_default().to_string_lossy().to_string()
        }
    };
    
    let txt_path = out_dir.join(format!("{}_ocr.txt", base_name));

    let temp_dir = std::env::temp_dir().join(format!("pdf_toolkit_ocr_{}", std::time::UNIX_EPOCH.elapsed().unwrap().as_millis()));
    std::fs::create_dir_all(&temp_dir).map_err(|e| format!("Failed to create temp dir: {}", e))?;

    let png_pattern = temp_dir.join("page_%03d.png").to_string_lossy().to_string();
    
    // 1. Ghostscript extraction to PNGs
    let gs_output = app.shell().sidecar("gs")
        .map_err(|e| format!("Failed to initialize Ghostscript sidecar: {}", e))?
        .args([
            "-dNOPAUSE",
            "-dBATCH",
            "-sDEVICE=png16m",
            "-r300",
            &format!("-sOutputFile={}", png_pattern),
            &input_path,
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to execute Ghostscript sidecar: {}", e))?;

    if !gs_output.status.success() {
        let stderr = String::from_utf8_lossy(&gs_output.stderr);
        let _ = std::fs::remove_dir_all(&temp_dir);
        return Err(format!("Failed to convert PDF to images: {}", stderr));
    }

    let mut entries: Vec<_> = std::fs::read_dir(&temp_dir)
        .map_err(|_| "Failed to read temp directory".to_string())?
        .filter_map(|e| e.ok())
        .collect();
    entries.sort_by_key(|e| e.path());

    let mut full_text = String::new();
    
    // Tesseract requires TESSDATA_PREFIX to be the parent of tessdata
    let resource_dir = app.path().resource_dir().map_err(|_| "Failed to get resource dir".to_string())?;

    for entry in entries {
        let png_path = entry.path();
        
        let temp_txt_base = temp_dir.join("temp_ocr").to_string_lossy().to_string();
        let temp_txt_full = temp_dir.join("temp_ocr.txt");

        let tess_output = app.shell().sidecar("tesseract")
            .map_err(|e| format!("Failed to initialize Tesseract sidecar: {}", e))?
            .env("TESSDATA_PREFIX", resource_dir.to_string_lossy().to_string())
            .args([
                &png_path.to_string_lossy().to_string(),
                &temp_txt_base,
                "-l", "eng",
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to execute Tesseract sidecar: {}", e))?;

        if tess_output.status.success() && temp_txt_full.exists() {
            let text = std::fs::read_to_string(&temp_txt_full).unwrap_or_default();
            full_text.push_str(&text);
            full_text.push_str("\n\n---\n\n");
            let _ = std::fs::remove_file(&temp_txt_full);
        }
    }

    std::fs::write(&txt_path, full_text).map_err(|e| format!("Failed to write final text file: {}", e))?;

    let _ = std::fs::remove_dir_all(&temp_dir);

    Ok(OcrResult {
        output_path: txt_path.to_string_lossy().to_string(),
    })
}