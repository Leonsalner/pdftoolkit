use crate::utils::validation::validate_pdf;
use pcsc::{Context, Protocols, Scope, ShareMode};
use serde::Serialize;

#[derive(Serialize)]
pub struct SignResult {
    pub output_path: String,
}

#[derive(Serialize)]
pub struct SmartCardInfo {
    pub name: String,
    pub present: bool,
}

#[tauri::command]
pub async fn detect_smart_cards() -> Result<Vec<SmartCardInfo>, String> {
    let ctx = Context::establish(Scope::User)
        .map_err(|e| format!("Failed to establish PCSC context: {}", e))?;

    let mut readers_buf = [0u8; 2048];
    let readers = match ctx.list_readers(&mut readers_buf) {
        Ok(r) => r,
        Err(_) => return Ok(vec![]), // No readers found
    };

    let mut info = Vec::new();
    for reader in readers {
        let name = reader.to_string_lossy().into_owned();
        let present = match ctx.connect(reader, ShareMode::Shared, Protocols::ANY) {
            Ok(_) => true,
            Err(_) => false,
        };
        info.push(SmartCardInfo { name, present });
    }

    Ok(info)
}

#[tauri::command]
pub async fn sign_pdf_file_based(
    app: tauri::AppHandle,
    input_path: String,
    _cert_path: String,
    _cert_password: String,
    output_name: Option<String>,
) -> Result<SignResult, String> {
    validate_pdf(&input_path)?;

    // In a real-world scenario, we'd use a crate like `endesive` or shell out to `openssl`
    // to perform the actual signing.
    // For now, we explicitly inform the user that this feature is in preview.
    Err("Digital signing is currently in preview and not yet implemented. No changes were made to your document.".to_string())
}
