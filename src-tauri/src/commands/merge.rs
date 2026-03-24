use serde::Serialize;
use tauri_plugin_shell::ShellExt;
use crate::utils::paths::{get_output_dir, output_filename};
use crate::utils::validation::validate_pdf;

#[derive(Serialize)]
pub struct MergeResult {
    pub output_path: String,
    pub files_merged: usize,
}

#[tauri::command]
pub async fn merge_pdfs(app: tauri::AppHandle, file_paths: Vec<String>, output_name: Option<String>, absolute_output_path: Option<String>) -> Result<MergeResult, String> {
    if file_paths.is_empty() {
        return Err("No files provided for merging".to_string());
    }

    for path in &file_paths {
        // Audit: Validate each input PDF
        validate_pdf(path)?;
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
            _ => output_filename(&file_paths[0], "merged"),
        };
        out_dir.join(file_name)
    };

    // Audit: Check if output file already exists
    if output_path.exists() {
        return Err("Output file already exists. Please choose a different name or location.".to_string());
    }

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

    let output = app.shell().sidecar("gs")
        .map_err(|e| format!("Failed to initialize Ghostscript sidecar: {}", e))?
        .args(args)
        .output()
        .await
        .map_err(|e| format!("Failed to execute Ghostscript: {}", e))?;

    if !output.status.success() {
        // Audit: Sanitize error
        return Err("Merge failed. One or more documents might be corrupted or protected.".to_string());
    }

    Ok(MergeResult {
        output_path: output_str,
        files_merged: file_paths.len(),
    })
}
