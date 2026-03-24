use std::fs;
use serde::Serialize;
use tauri_plugin_shell::ShellExt;
use crate::utils::paths::{get_output_dir, output_filename};
use crate::utils::validation::validate_pdf;

#[derive(Serialize)]
pub struct CompressResult {
    pub output_path: String,
    pub original_size: u64,
    pub compressed_size: u64,
}

#[tauri::command]
pub async fn compress_pdf(app: tauri::AppHandle, input_path: String, preset: String, output_name: Option<String>, absolute_output_path: Option<String>) -> Result<CompressResult, String> {
    // Audit: Validate input PDF
    validate_pdf(&input_path)?;

    let valid_presets = ["screen", "ebook", "printer", "prepress"];
    if !valid_presets.contains(&preset.as_str()) {
        return Err(format!("Invalid preset: {}. Use screen, ebook, printer, or prepress", preset));
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
            _ => output_filename(&input_path, "compressed"),
        };
        out_dir.join(file_name)
    };
    
    // Audit: Check if output file already exists
    if output_path.exists() {
        return Err("Output file already exists. Please choose a different name or location.".to_string());
    }

    let output_str = output_path.to_string_lossy().to_string();

    let original_size = fs::metadata(&input_path)
        .map_err(|e| format!("Failed to read original file size: {}", e))?
        .len();

    let output = app.shell().sidecar("gs")
        .map_err(|e| format!("Failed to initialize Ghostscript sidecar: {}", e))?
        .args([
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            &format!("-dPDFSETTINGS=/{}", preset),
            "-dNOPAUSE",
            "-dBATCH",
            "-dQUIET",
            &format!("-sOutputFile={}", output_str),
            &input_path,
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to execute Ghostscript: {}", e))?;

    if !output.status.success() {
        // Audit: Sanitize error
        return Err("Compression failed. The document might be corrupted or protected.".to_string());
    }

    let compressed_size = fs::metadata(&output_path)
        .map_err(|e| format!("Failed to read compressed file size: {}", e))?
        .len();

    Ok(CompressResult {
        output_path: output_str,
        original_size,
        compressed_size,
    })
}

#[tauri::command]
pub async fn check_ghostscript(app: tauri::AppHandle) -> Result<bool, String> {
    match app.shell().sidecar("gs") {
        Ok(cmd) => {
            match cmd.arg("--version").output().await {
                Ok(output) => Ok(output.status.success()),
                Err(_) => Ok(false),
            }
        }
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn get_file_size(input_path: String) -> Result<u64, String> {
    fs::metadata(&input_path)
        .map(|m| m.len())
        .map_err(|e| format!("Failed to read file size: {}", e))
}
