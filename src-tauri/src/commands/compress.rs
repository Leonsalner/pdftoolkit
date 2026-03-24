use std::process::Command;
use std::fs;
use std::path::Path;
use serde::Serialize;
use crate::utils::paths::{downloads_dir, output_filename};

#[derive(Serialize)]
pub struct CompressResult {
    pub output_path: String,
    pub original_size: u64,
    pub compressed_size: u64,
}

#[tauri::command]
pub async fn compress_pdf(input_path: String, preset: String, output_name: Option<String>) -> Result<CompressResult, String> {
    if !Path::new(&input_path).exists() {
        return Err(format!("File not found: {}", input_path));
    }

    let valid_presets = ["screen", "ebook", "printer", "prepress"];
    if !valid_presets.contains(&preset.as_str()) {
        return Err(format!("Invalid preset: {}. Use screen, ebook, printer, or prepress", preset));
    }

    let downloads = downloads_dir()?;
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
    
    let output_path = downloads.join(file_name);
    let output_str = output_path.to_string_lossy().to_string();

    let original_size = fs::metadata(&input_path)
        .map_err(|e| format!("Failed to read original file size: {}", e))?
        .len();

    let output = Command::new("gs")
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
        .map_err(|_| "Ghostscript (gs) not found. Install with: brew install ghostscript".to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Compression failed: {}", stderr));
    }

    let compressed_size = fs::metadata(&output_path)
        .map_err(|e| format!("Failed to write output: {}", e))?
        .len();

    Ok(CompressResult {
        output_path: output_str,
        original_size,
        compressed_size,
    })
}

#[tauri::command]
pub async fn check_ghostscript() -> Result<bool, String> {
    match Command::new("gs").arg("--version").output() {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn get_file_size(input_path: String) -> Result<u64, String> {
    fs::metadata(&input_path)
        .map(|m| m.len())
        .map_err(|e| format!("Failed to read file size: {}", e))
}