use serde::Serialize;
use lopdf::Document;
use crate::utils::paths::{downloads_dir, output_filename};

#[derive(Serialize)]
pub struct ExtractResult {
    pub output_path: String,
    pub pages_extracted: u32,
}

#[tauri::command]
pub async fn get_pdf_page_count(input_path: String) -> Result<u32, String> {
    let doc = Document::load(&input_path).map_err(|e| format!("Failed to read PDF: {}", e))?;
    Ok(doc.get_pages().len() as u32)
}

#[tauri::command]
pub async fn extract_pages(input_path: String, ranges: String) -> Result<ExtractResult, String> {
    let mut doc = Document::load(&input_path).map_err(|e| format!("Failed to read PDF: {}", e))?;
    let total_pages = doc.get_pages().len() as u32;

    let mut pages_to_keep = Vec::new();
    let parts = ranges.split(',');
    
    for part in parts {
        let part = part.trim();
        if part.is_empty() { continue; }

        if part.contains('-') {
            let bounds: Vec<&str> = part.split('-').collect();
            if bounds.len() != 2 {
                return Err(format!("Invalid range '{}': Invalid format", part));
            }
            let start = bounds[0].trim().parse::<u32>().map_err(|_| format!("Invalid range '{}': Not a number", part))?;
            let end = bounds[1].trim().parse::<u32>().map_err(|_| format!("Invalid range '{}': Not a number", part))?;
            
            if start < 1 || start > total_pages || end < 1 || end > total_pages || start > end {
                return Err(format!("Invalid range '{}': Out of bounds", part));
            }
            for p in start..=end {
                pages_to_keep.push(p);
            }
        } else {
            let p = part.parse::<u32>().map_err(|_| format!("Invalid range '{}': Not a number", part))?;
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

    let mut doc_pages = doc.get_pages();
    let mut page_object_ids = Vec::new();
    
    for p in &pages_to_keep {
        if let Some(obj_id) = doc_pages.get(p) {
            page_object_ids.push(*obj_id);
        }
    }
    
    // lopdf handles page deletion if we just keep the ones we need, or we can filter.
    // However, it's easier to use the filter method if available, or delete what we don't want.
    let mut pages_to_delete = Vec::new();
    for (page_num, _) in doc_pages.iter() {
        if !pages_to_keep.contains(page_num) {
            pages_to_delete.push(*page_num);
        }
    }
    
    doc.delete_pages(&pages_to_delete);

    let downloads = downloads_dir()?;
    let file_name = output_filename(&input_path, "extracted");
    let output_path = downloads.join(file_name);
    let output_str = output_path.to_string_lossy().to_string();

    doc.save(&output_path).map_err(|e| format!("Failed to write output: {}", e))?;

    Ok(ExtractResult {
        output_path: output_str,
        pages_extracted: pages_to_keep.len() as u32,
    })
}