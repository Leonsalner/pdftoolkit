use crate::utils::paths::{get_output_dir, output_filename};
use crate::utils::validation::validate_pdf;
use lopdf::{Document, Object};
use serde::Serialize;
use std::collections::HashMap;

#[derive(Serialize)]
pub struct FormDataResult {
    pub output_path: String,
    pub field_count: usize,
}

#[tauri::command]
pub async fn extract_form_data(
    app: tauri::AppHandle,
    input_path: String,
    output_name: Option<String>,
) -> Result<FormDataResult, String> {
    validate_pdf(&input_path)?;

    let doc = Document::load(&input_path).map_err(|e| format!("Failed to load PDF: {}", e))?;
    
    let mut form_values = HashMap::new();

    // Check for AcroForm in the catalog
    if let Ok(catalog) = doc.catalog() {
        if let Ok(acroform) = catalog.get(b"AcroForm").and_then(|obj| obj.as_dict()) {
            if let Ok(fields) = acroform.get(b"Fields").and_then(|obj| obj.as_array()) {
                for field_ref in fields {
                    if let Ok(field_id) = field_ref.as_reference() {
                        if let Ok(field_dict) = doc.get_object(field_id).and_then(|obj| obj.as_dict()) {
                            // /T is the field name, /V is the value
                            let name = field_dict.get(b"T").ok()
                                .and_then(|obj| obj.as_str().ok())
                                .map(|s| String::from_utf8_lossy(s).to_string())
                                .unwrap_or_else(|| format!("Field_{}", field_id.0));
                            
                            let value = field_dict.get(b"V").ok()
                                .map(|obj| match obj {
                                    Object::String(bytes, _) => String::from_utf8_lossy(bytes).to_string(),
                                    Object::Name(name) => String::from_utf8_lossy(name).to_string(),
                                    Object::Integer(i) => i.to_string(),
                                    Object::Real(f) => f.to_string(),
                                    Object::Boolean(b) => b.to_string(),
                                    _ => "Unsupported Type".to_string(),
                                })
                                .unwrap_or_default();

                            form_values.insert(name, value);
                        }
                    }
                }
            }
        }
    }

    if form_values.is_empty() {
        return Err("No AcroForm data found in this PDF.".to_string());
    }

    let out_dir = get_output_dir(&app)?;
    let out_name = match output_name {
        Some(name) if !name.trim().is_empty() => {
            if name.to_lowercase().ends_with(".json") {
                name
            } else {
                format!("{}.json", name)
            }
        }
        _ => output_filename(&input_path, "form_data").replace(".pdf", ".json"),
    };
    
    let output_path = out_dir.join(out_name);
    let json_data = serde_json::to_string_pretty(&form_values).map_err(|e| e.to_string())?;
    
    std::fs::write(&output_path, json_data).map_err(|e| format!("Failed to write JSON: {}", e))?;

    Ok(FormDataResult {
        output_path: output_path.to_string_lossy().to_string(),
        field_count: form_values.len(),
    })
}