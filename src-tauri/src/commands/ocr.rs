use serde::Serialize;
use tauri_plugin_shell::ShellExt;
use tauri::Manager;
use crate::utils::validation::{validate_pdf, validate_ocr_lang};

#[derive(Serialize)]
pub struct OcrResult {
    pub text: String,
}

#[tauri::command]
pub async fn extract_text_ocr(app: tauri::AppHandle, input_path: String, lang: String) -> Result<OcrResult, String> {
    // Audit: Validate input PDF
    validate_pdf(&input_path)?;
    
    // Audit: Validate language
    validate_ocr_lang(&lang)?;

    let timestamp = std::time::UNIX_EPOCH.elapsed()
        .map_err(|e| format!("System time error: {}", e))?
        .as_millis();
        
    let temp_dir = std::env::temp_dir().join(format!("pdf_toolkit_ocr_{}", timestamp));
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
        .map_err(|e| format!("Failed to execute Ghostscript: {}", e))?;

    if !gs_output.status.success() {
        // Audit: Sanitize error
        let _ = std::fs::remove_dir_all(&temp_dir);
        return Err("Failed to convert PDF to images. The document might be corrupted or protected.".to_string());
    }

    let entries = std::fs::read_dir(&temp_dir)
        .map_err(|_| "Failed to read processing directory".to_string())?;
        
    let mut paths: Vec<_> = entries.filter_map(|e| e.ok()).map(|e| e.path()).collect();
    paths.sort();

    let mut full_text = String::new();
    
    // Tesseract requires TESSDATA_PREFIX to be the parent of tessdata
    let resource_dir = app.path().resource_dir().map_err(|_| "Internal application error".to_string())?;

    for png_path in paths {
        let temp_txt_base = temp_dir.join("temp_ocr").to_string_lossy().to_string();
        let temp_txt_full = temp_dir.join("temp_ocr.txt");

        let tess_output = app.shell().sidecar("tesseract")
            .map_err(|e| format!("Failed to initialize Text Recognition: {}", e))?
            .env("TESSDATA_PREFIX", resource_dir.to_string_lossy().to_string())
            .args([
                &png_path.to_string_lossy().to_string(),
                &temp_txt_base,
                "-l", &lang,
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to run Text Recognition: {}", e))?;

        if tess_output.status.success() && temp_txt_full.exists() {
            // Audit: Explicitly handle read errors
            let text = std::fs::read_to_string(&temp_txt_full)
                .map_err(|e| format!("Failed to read recognized text: {}", e))?;
            full_text.push_str(&text);
            full_text.push_str("\n\n---\n\n");
            let _ = std::fs::remove_file(&temp_txt_full);
        }
    }

    let _ = std::fs::remove_dir_all(&temp_dir);

    if full_text.trim().is_empty() {
        return Err("No text was found in the document.".to_string());
    }

    Ok(OcrResult {
        text: full_text,
    })
}
