use crate::utils::paths::{get_output_dir, output_filename};
use crate::utils::validation::validate_pdf;
use lopdf::Document;
use serde::Serialize;
use tauri_plugin_shell::ShellExt;

#[derive(Serialize)]
pub struct CleanResult {
    pub output_path: String,
    pub original_pages: u32,
    pub pages_removed: u32,
}

#[tauri::command]
pub async fn remove_blank_pages(
    app: tauri::AppHandle,
    input_path: String,
    output_name: Option<String>,
) -> Result<CleanResult, String> {
    validate_pdf(&input_path)?;

    // Run Ghostscript inkcov to detect blank pages
    let output = app
        .shell()
        .sidecar("gs")
        .map_err(|e| format!("Failed to find Ghostscript sidecar: {}", e))?
        .args([
            "-q",
            "-o",
            "-",
            "-sDEVICE=inkcov",
            &input_path,
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to execute Ghostscript: {}", e))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Ghostscript failed: {}", err_msg));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    // Parse inkcov output
    // Example line: " 0.00000  0.00000  0.00000  0.00000 CMYK OK"
    let mut non_blank_pages = Vec::new();
    let mut page_idx = 1;
    let threshold = 0.0001; // Tiny threshold for noise/artifacts

    for line in stdout.lines() {
        if line.contains("CMYK OK") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                if let (Ok(c), Ok(m), Ok(y), Ok(k)) = (
                    parts[0].parse::<f32>(),
                    parts[1].parse::<f32>(),
                    parts[2].parse::<f32>(),
                    parts[3].parse::<f32>(),
                ) {
                    let total_ink = c + m + y + k;
                    if total_ink > threshold {
                        non_blank_pages.push(page_idx);
                    }
                }
            }
            page_idx += 1;
        }
    }

    let total_pages = page_idx - 1;
    let pages_removed = total_pages - non_blank_pages.len() as u32;

    if pages_removed == 0 {
        return Err("No blank pages detected.".to_string());
    }

    if non_blank_pages.is_empty() {
        return Err("All pages appear blank. Aborting removal.".to_string());
    }

    // Now use lopdf to build the new PDF with non-blank pages
    let mut doc = Document::load(&input_path).map_err(|e| format!("Failed to load PDF: {}", e))?;
    
    // Remove pages not in non_blank_pages
    let all_pages: Vec<u32> = doc.get_pages().keys().cloned().collect();
    let mut pages_to_delete = Vec::new();
    for p in all_pages {
        if !non_blank_pages.contains(&p) {
            pages_to_delete.push(p);
        }
    }
    doc.delete_pages(&pages_to_delete);

    let out_dir = get_output_dir(&app)?;
    let output_path = out_dir.join(match output_name {
        Some(name) if !name.trim().is_empty() => {
            if name.to_lowercase().ends_with(".pdf") {
                name
            } else {
                format!("{}.pdf", name)
            }
        }
        _ => output_filename(&input_path, "cleaned"),
    });

    if output_path.exists() {
        return Err("Output file already exists.".to_string());
    }

    doc.save(&output_path)
        .map_err(|e| format!("Failed to save PDF: {}", e))?;

    Ok(CleanResult {
        output_path: output_path.to_string_lossy().to_string(),
        original_pages: total_pages,
        pages_removed,
    })
}