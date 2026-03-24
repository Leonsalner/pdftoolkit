use std::process::Command;
use std::path::Path;
use serde::Serialize;
use crate::utils::paths::{downloads_dir, output_filename};

#[derive(Serialize)]
pub struct MergeResult {
    pub output_path: String,
    pub files_merged: usize,
}

#[tauri::command]
pub async fn merge_pdfs(file_paths: Vec<String>, output_name: Option<String>) -> Result<MergeResult, String> {
    if file_paths.is_empty() {
        return Err("No files provided for merging".to_string());
    }

    for path in &file_paths {
        if !Path::new(path).exists() {
            return Err(format!("File not found: {}", path));
        }
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
        _ => output_filename(&file_paths[0], "merged"),
    };

    let output_path = downloads.join(file_name);
    let output_str = output_path.to_string_lossy().to_string();

    let mut args = vec![
        "-sDEVICE=pdfwrite".to_string(),
        "-dNOPAUSE".to_string(),
        "-dBATCH".to_string(),
        "-dAutoRotatePages=/None".to_string(),
        format!("-sOutputFile={}", output_str),
    ];

    for path in &file_paths {
        args.push(path.clone());
    }

    let output = Command::new("gs")
        .args(&args)
        .output()
        .map_err(|_| "Ghostscript (gs) not found. Install with: brew install ghostscript".to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Merge failed: {}", stderr));
    }

    Ok(MergeResult {
        output_path: output_str,
        files_merged: file_paths.len(),
    })
}