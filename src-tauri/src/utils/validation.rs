use std::path::Path;
use std::fs::File;
use std::io::Read;

/// Validates that a file exists and has the %PDF- magic number.
pub fn validate_pdf<P: AsRef<Path>>(path: P) -> Result<(), String> {
    let path = path.as_ref();
    if !path.exists() {
        return Err(format!("File not found: {}", path.display()));
    }

    let mut file = File::open(path).map_err(|e| format!("Failed to open file: {}", e))?;
    let mut header = [0u8; 5];
    file.read_exact(&mut header).map_err(|_| "Not a valid PDF file (too small)".to_string())?;

    if &header != b"%PDF-" {
        return Err("File is not a valid PDF document".to_string());
    }

    Ok(())
}

/// Validates that the OCR language is supported.
pub fn validate_ocr_lang(lang: &str) -> Result<(), String> {
    let supported = ["eng", "slk", "ces"];
    if !supported.contains(&lang) {
        return Err(format!("Unsupported OCR language: {}. Supported: eng, slk, ces", lang));
    }
    Ok(())
}
