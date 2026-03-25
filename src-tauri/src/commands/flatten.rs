use crate::utils::paths::{get_output_dir, output_filename};
use crate::utils::validation::validate_pdf;
use serde::Serialize;
use tauri_plugin_shell::ShellExt;

#[derive(Serialize)]
pub struct FlattenResult {
    pub output_path: String,
}

#[tauri::command]
pub async fn flatten_pdf(
    app: tauri::AppHandle,
    input_path: String,
    output_name: Option<String>,
) -> Result<FlattenResult, String> {
    validate_pdf(&input_path)?;

    let out_dir = get_output_dir(&app)?;
    let output_path = out_dir.join(match output_name {
        Some(name) if !name.trim().is_empty() => {
            if name.to_lowercase().ends_with(".pdf") {
                name
            } else {
                format!("{}.pdf", name)
            }
        }
        _ => output_filename(&input_path, "flattened"),
    });

    if output_path.exists() {
        return Err("Output file already exists.".to_string());
    }

    let output = app
        .shell()
        .sidecar("qpdf")
        .map_err(|e| format!("Failed to find qpdf sidecar: {}", e))?
        .args([
            "--flatten-annotations=all",
            &input_path,
            &output_path.to_string_lossy().to_string(),
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to execute qpdf: {}", e))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("qpdf failed: {}", err_msg));
    }

    Ok(FlattenResult {
        output_path: output_path.to_string_lossy().to_string(),
    })
}