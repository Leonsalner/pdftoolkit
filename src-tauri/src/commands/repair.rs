use crate::utils::paths::{get_output_dir, output_filename};
use serde::Serialize;
use tauri_plugin_shell::ShellExt;

#[derive(Serialize)]
pub struct RepairResult {
    pub output_path: String,
    pub method_used: String,
}

#[tauri::command]
pub async fn repair_pdf(
    app: tauri::AppHandle,
    input_path: String,
    output_name: Option<String>,
) -> Result<RepairResult, String> {
    // We intentionally don't validate strictly here because a broken PDF
    // might fail validation but still be repairable.
    if !std::path::Path::new(&input_path).exists() {
        return Err("Input file does not exist.".into());
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
        _ => output_filename(&input_path, "repaired"),
    });

    if output_path.exists() {
        return Err("Output file already exists.".to_string());
    }

    // Method 1: qpdf --empty --pages input.pdf 1-z -- output.pdf
    let qpdf_output = app
        .shell()
        .sidecar("qpdf")
        .map_err(|e| format!("Failed to find qpdf sidecar: {}", e))?
        .args([
            "--empty",
            "--pages",
            &input_path,
            "1-z",
            "--",
            &output_path.to_string_lossy().to_string(),
        ])
        .output()
        .await;

    if let Ok(out) = qpdf_output {
        if out.status.success() {
            return Ok(RepairResult {
                output_path: output_path.to_string_lossy().to_string(),
                method_used: "qpdf".to_string(),
            });
        }
    }

    // Method 2: Ghostscript re-distill
    // gs -o output.pdf -sDEVICE=pdfwrite -dPDFSETTINGS=/default input.pdf
    let gs_output = app
        .shell()
        .sidecar("gs")
        .map_err(|e| format!("Failed to find Ghostscript sidecar: {}", e))?
        .args([
            "-o",
            &output_path.to_string_lossy().to_string(),
            "-sDEVICE=pdfwrite",
            "-dPDFSETTINGS=/default",
            &input_path,
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to execute Ghostscript: {}", e))?;

    if gs_output.status.success() {
        return Ok(RepairResult {
            output_path: output_path.to_string_lossy().to_string(),
            method_used: "ghostscript".to_string(),
        });
    }

    let err_msg = String::from_utf8_lossy(&gs_output.stderr);
    Err(format!("Both qpdf and ghostscript failed to repair the PDF: {}", err_msg))
}