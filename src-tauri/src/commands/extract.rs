use crate::utils::paths::{get_output_dir, output_filename};
use crate::utils::validation::validate_pdf;
use lopdf::Document;
use serde::Serialize;

#[derive(Serialize)]
pub struct ExtractResult {
    pub output_path: String,
    pub pages_extracted: u32,
}

#[tauri::command]
pub async fn get_pdf_page_count(input_path: String) -> Result<u32, String> {
    // Audit: Validate input PDF
    validate_pdf(&input_path)?;
    let doc = Document::load(&input_path).map_err(|e| format!("Failed to read PDF: {}", e))?;
    Ok(doc.get_pages().len() as u32)
}

#[tauri::command]
pub async fn extract_pages(
    app: tauri::AppHandle,
    input_path: String,
    ranges: String,
    output_name: Option<String>,
    absolute_output_path: Option<String>,
) -> Result<ExtractResult, String> {
    // Audit: Validate input PDF
    validate_pdf(&input_path)?;
    let mut doc = Document::load(&input_path).map_err(|e| format!("Failed to read PDF: {}", e))?;
    let total_pages = doc.get_pages().len() as u32;

    let mut pages_to_keep = Vec::new();
    let parts = ranges.split(',');

    for part in parts {
        let part = part.trim();
        if part.is_empty() {
            continue;
        }

        if part.contains('-') {
            let bounds: Vec<&str> = part.split('-').collect();
            if bounds.len() != 2 {
                return Err(format!("Invalid range '{}': Invalid format", part));
            }
            let start = bounds[0]
                .trim()
                .parse::<u32>()
                .map_err(|_| format!("Invalid range '{}': Not a number", part))?;
            let end = bounds[1]
                .trim()
                .parse::<u32>()
                .map_err(|_| format!("Invalid range '{}': Not a number", part))?;

            if start < 1 || start > total_pages || end < 1 || end > total_pages || start > end {
                return Err(format!("Invalid range '{}': Out of bounds", part));
            }
            for p in start..=end {
                pages_to_keep.push(p);
            }
        } else {
            let p = part
                .parse::<u32>()
                .map_err(|_| format!("Invalid range '{}': Not a number", part))?;
            if p < 1 || p > total_pages {
                return Err(format!("Invalid range '{}': Out of bounds", part));
            }
            pages_to_keep.push(p);
        }
    }

    pages_to_keep.sort();
    pages_to_keep.dedup();

    if pages_to_keep.is_empty() {
        return Err("No valid pages specified to extract".to_string());
    }

    let doc_pages = doc.get_pages();

    let mut pages_to_delete = Vec::new();
    for (page_num, _) in doc_pages.iter() {
        if !pages_to_keep.contains(page_num) {
            pages_to_delete.push(*page_num);
        }
    }

    doc.delete_pages(&pages_to_delete);

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
            _ => {
                let sanitized_ranges = ranges.replace(',', "_").replace(' ', "");
                output_filename(&input_path, &sanitized_ranges)
            }
        };
        out_dir.join(file_name)
    };

    // Audit: Check if output file already exists
    if output_path.exists() {
        return Err(
            "Output file already exists. Please choose a different name or location.".to_string(),
        );
    }

    let output_str = output_path.to_string_lossy().to_string();

    doc.save(&output_path)
        .map_err(|e| format!("Failed to write output: {}", e))?;

    Ok(ExtractResult {
        output_path: output_str,
        pages_extracted: pages_to_keep.len() as u32,
    })
}
