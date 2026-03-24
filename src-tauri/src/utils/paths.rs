use std::path::{Path, PathBuf};

pub fn downloads_dir() -> Result<PathBuf, String> {
    dirs::download_dir()
        .ok_or_else(|| "Could not locate Downloads directory".to_string())
}

pub fn output_filename(original: &str, suffix: &str) -> String {
    let path = Path::new(original);
    let stem = path.file_stem().unwrap_or_default().to_string_lossy();
    let ext = path.extension().unwrap_or_default().to_string_lossy();
    
    if ext.is_empty() {
        format!("{}_{}", stem, suffix)
    } else {
        format!("{}_{}.{}", stem, suffix, ext)
    }
}