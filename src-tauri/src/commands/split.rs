use crate::utils::paths::get_output_dir;
use crate::utils::validation::validate_pdf;
use lopdf::Document;
use serde::Serialize;
use std::path::Path;

#[derive(Serialize)]
pub struct SplitResult {
    pub output_paths: Vec<String>,
    pub total_files: usize,
}

#[tauri::command]
pub async fn split_pdf(
    app: tauri::AppHandle,
    input_path: String,
    mode: String,
    value: String,
    output_prefix: Option<String>,
    absolute_output_dir: Option<String>,
) -> Result<SplitResult, String> {
    // Audit: Validate input PDF
    validate_pdf(&input_path)?;
    let doc = Document::load(&input_path).map_err(|e| format!("Failed to read PDF: {}", e))?;
    let total_pages = doc.get_pages().len() as u32;

    let mut chunks: Vec<Vec<u32>> = Vec::new();

    match mode.as_str() {
        "every_n" => {
            let n = value
                .parse::<u32>()
                .map_err(|_| "Invalid chunk size".to_string())?;
            if n < 1 {
                return Err("Chunk size must be at least 1".to_string());
            }
            let mut current_chunk = Vec::new();
            for i in 1..=total_pages {
                current_chunk.push(i);
                if current_chunk.len() as u32 == n {
                    chunks.push(current_chunk);
                    current_chunk = Vec::new();
                }
            }
            if !current_chunk.is_empty() {
                chunks.push(current_chunk);
            }
        }
        "ranges" => {
            let parts = value.split(',');
            for part in parts {
                let part = part.trim();
                if part.is_empty() {
                    continue;
                }
                let mut current_chunk = Vec::new();
                if part.contains('-') {
                    let bounds: Vec<&str> = part.split('-').collect();
                    if bounds.len() != 2 {
                        return Err(format!("Invalid range '{}'", part));
                    }
                    let start = bounds[0]
                        .trim()
                        .parse::<u32>()
                        .map_err(|_| format!("Invalid range '{}'", part))?;
                    let end = bounds[1]
                        .trim()
                        .parse::<u32>()
                        .map_err(|_| format!("Invalid range '{}'", part))?;
                    if start < 1
                        || start > total_pages
                        || end < 1
                        || end > total_pages
                        || start > end
                    {
                        return Err(format!("Invalid range '{}': Out of bounds", part));
                    }
                    for p in start..=end {
                        current_chunk.push(p);
                    }
                } else {
                    let p = part
                        .parse::<u32>()
                        .map_err(|_| format!("Invalid range '{}'", part))?;
                    if p < 1 || p > total_pages {
                        return Err(format!("Invalid range '{}': Out of bounds", part));
                    }
                    current_chunk.push(p);
                }
                chunks.push(current_chunk);
            }
        }
        _ => return Err("Unknown split mode".to_string()),
    }

    if chunks.is_empty() {
        return Err("No chunks to split into".to_string());
    }

    let out_dir = if let Some(abs_dir) = absolute_output_dir {
        std::path::PathBuf::from(abs_dir)
    } else {
        get_output_dir(&app)?
    };

    let base_name = match output_prefix {
        Some(name) if !name.trim().is_empty() => name,
        _ => {
            let path = Path::new(&input_path);
            path.file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string()
        }
    };

    let mut generated_paths = Vec::new();

    for (i, chunk) in chunks.iter().enumerate() {
        let mut new_doc = doc.clone();
        let doc_pages = new_doc.get_pages();
        let mut pages_to_delete = Vec::new();

        for (page_num, _) in doc_pages.iter() {
            if !chunk.contains(page_num) {
                pages_to_delete.push(*page_num);
            }
        }

        new_doc.delete_pages(&pages_to_delete);

        let file_name = format!("{}_part{}.pdf", base_name, i + 1);
        let output_path = out_dir.join(&file_name);

        // Audit: Check if output file already exists
        if output_path.exists() {
            return Err(format!(
                "Output file '{}' already exists. Please choose a different prefix or location.",
                file_name
            ));
        }

        let output_str = output_path.to_string_lossy().to_string();

        new_doc
            .save(&output_path)
            .map_err(|e| format!("Failed to write output: {}", e))?;
        generated_paths.push(output_str);
    }

    Ok(SplitResult {
        total_files: generated_paths.len(),
        output_paths: generated_paths,
    })
}
