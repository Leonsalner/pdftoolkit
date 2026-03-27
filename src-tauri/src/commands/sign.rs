use crate::utils::validation::validate_pdf;
use serde::Serialize;

#[derive(Serialize)]
pub struct SignResult {
    pub output_path: String,
    pub signer_name: Option<String>,
    pub signed_at: String,
    pub timestamped: bool,
}

#[tauri::command]
pub async fn sign_pdf_file_based(
    _app: tauri::AppHandle,
    input_path: String,
    _cert_path: String,
    _cert_password: String,
    _visible: bool,
    _page: Option<u32>,
    _x: Option<f32>,
    _y: Option<f32>,
    _reason: Option<String>,
    _location: Option<String>,
    _contact_info: Option<String>,
    _output_name: Option<String>,
) -> Result<SignResult, String> {
    validate_pdf(&input_path)?;
    Err("Digital signing is currently in preview and not yet implemented. No changes were made to your document.".to_string())
}