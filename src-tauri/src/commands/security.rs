use crate::utils::paths::{get_output_dir, output_filename};
use crate::utils::validation::validate_pdf;
use serde::Serialize;
use tauri_plugin_shell::ShellExt;

#[derive(Serialize)]
pub struct SecurityResult {
    pub output_path: String,
}

#[tauri::command]
pub async fn add_pdf_security(
    app: tauri::AppHandle,
    input_path: String,
    user_password: Option<String>,
    owner_password: Option<String>,
    allow_print: bool,
    allow_copy: bool,
    allow_modify: bool,
    output_name: Option<String>,
) -> Result<SecurityResult, String> {
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
        _ => output_filename(&input_path, "secured"),
    });

    if output_path.exists() {
        return Err("Output file already exists.".to_string());
    }

    let output_str = output_path.to_string_lossy().to_string();

    let mut args = vec![input_path, output_str.clone(), "--encrypt".to_string()];

    // User password (to open)
    args.push(user_password.unwrap_or_else(|| "".to_string()));

    // Owner password (to change permissions)
    let final_owner_pass = owner_password
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    args.push(final_owner_pass);

    // Key length
    args.push("256".to_string());

    // Permissions
    if !allow_print {
        args.push("--print=n".to_string());
    }
    if !allow_copy {
        args.push("--extract=n".to_string());
    }
    if !allow_modify {
        args.push("--modify=n".to_string());
    }

    args.push("--".to_string());

    let output = app
        .shell()
        .sidecar("qpdf")
        .map_err(|e| format!("Failed to initialize qpdf sidecar: {}", e))?
        .args(args)
        .output()
        .await
        .map_err(|e| format!("Failed to execute qpdf: {}", e))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Security encryption failed: {}", err_msg));
    }

    Ok(SecurityResult {
        output_path: output_str,
    })
}

#[tauri::command]
pub async fn decrypt_pdf(
    app: tauri::AppHandle,
    input_path: String,
    password: String,
    output_name: Option<String>,
) -> Result<SecurityResult, String> {
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
        _ => output_filename(&input_path, "decrypted"),
    });

    let output_str = output_path.to_string_lossy().to_string();

    let output = app
        .shell()
        .sidecar("qpdf")
        .map_err(|e| format!("Failed to initialize qpdf sidecar: {}", e))?
        .args([
            &format!("--password={}", password),
            "--decrypt",
            &input_path,
            &output_str,
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to execute qpdf: {}", e))?;

    if !output.status.success() {
        return Err("Decryption failed. Incorrect password or corrupted file.".to_string());
    }

    Ok(SecurityResult {
        output_path: output_str,
    })
}

#[tauri::command]
pub async fn check_pdf_encrypted(input_path: String) -> Result<bool, String> {
    validate_pdf(&input_path)?;
    let doc =
        lopdf::Document::load(&input_path).map_err(|e| format!("Failed to load PDF: {}", e))?;
    Ok(doc.is_encrypted())
}
