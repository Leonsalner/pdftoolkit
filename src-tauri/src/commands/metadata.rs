use crate::utils::paths::{get_output_dir, output_filename};
use lopdf::{Dictionary, Document, Object, StringFormat};
use serde::Serialize;

#[derive(Serialize)]
pub struct PdfMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
}

#[derive(Serialize)]
pub struct MetadataResult {
    pub output_path: String,
    pub overwritten: bool,
}

#[tauri::command]
pub async fn get_pdf_metadata(input_path: String) -> Result<PdfMetadata, String> {
    let doc = Document::load(&input_path).map_err(|e| format!("Failed to load PDF: {}", e))?;

    let mut metadata = PdfMetadata {
        title: None,
        author: None,
        subject: None,
    };

    if let Ok(info_ref) = doc.trailer.get(b"Info") {
        if let Ok(id) = info_ref.as_reference() {
            if let Some(info_obj) = doc.objects.get(&id) {
                if let Ok(dict) = info_obj.as_dict() {
                    if let Ok(title) = dict.get(b"Title") {
                        if let Ok(bytes) = title.as_str() {
                            metadata.title = Some(String::from_utf8_lossy(bytes).into_owned());
                        }
                    }
                    if let Ok(author) = dict.get(b"Author") {
                        if let Ok(bytes) = author.as_str() {
                            metadata.author = Some(String::from_utf8_lossy(bytes).into_owned());
                        }
                    }
                    if let Ok(subject) = dict.get(b"Subject") {
                        if let Ok(bytes) = subject.as_str() {
                            metadata.subject = Some(String::from_utf8_lossy(bytes).into_owned());
                        }
                    }
                }
            }
        }
    }

    Ok(metadata)
}

#[tauri::command]
pub async fn set_pdf_metadata(
    app: tauri::AppHandle,
    input_path: String,
    title: String,
    author: String,
    subject: String,
    save_as_new: bool,
    output_name: Option<String>,
) -> Result<MetadataResult, String> {
    let mut doc = Document::load(&input_path).map_err(|e| format!("Failed to load PDF: {}", e))?;

    let info_id = match doc.trailer.get(b"Info").and_then(|o| o.as_reference()) {
        Ok(id) => id,
        Err(_) => {
            let dict = Dictionary::new();
            let id = doc.add_object(dict);
            doc.trailer.set("Info", Object::Reference(id));
            id
        }
    };

    if let Some(Object::Dictionary(dict)) = doc.objects.get_mut(&info_id) {
        if !title.is_empty() {
            dict.set(
                "Title",
                Object::String(title.into_bytes(), StringFormat::Literal),
            );
        } else {
            dict.remove(b"Title");
        }
        if !author.is_empty() {
            dict.set(
                "Author",
                Object::String(author.into_bytes(), StringFormat::Literal),
            );
        } else {
            dict.remove(b"Author");
        }
        if !subject.is_empty() {
            dict.set(
                "Subject",
                Object::String(subject.into_bytes(), StringFormat::Literal),
            );
        } else {
            dict.remove(b"Subject");
        }
    } else {
        return Err("Failed to find or create Info dictionary".to_string());
    }

    if save_as_new {
        let out_dir = get_output_dir(&app)?;
        let file_name = match output_name {
            Some(name) if !name.trim().is_empty() => {
                if name.to_lowercase().ends_with(".pdf") {
                    name
                } else {
                    format!("{}.pdf", name)
                }
            }
            _ => output_filename(&input_path, "metadata"),
        };
        let output_path = out_dir.join(file_name);
        if output_path.exists() {
            return Err(
                "Output file already exists. Please choose a different name or location."
                    .to_string(),
            );
        }
        doc.save(&output_path)
            .map_err(|e| format!("Failed to save PDF: {}", e))?;
        Ok(MetadataResult {
            output_path: output_path.to_string_lossy().to_string(),
            overwritten: false,
        })
    } else {
        let tmp_path = format!("{}.tmp", input_path);
        doc.save(&tmp_path)
            .map_err(|e| format!("Failed to save temporary PDF: {}", e))?;
        std::fs::rename(&tmp_path, &input_path)
            .map_err(|e| format!("Failed to overwrite original file: {}", e))?;
        Ok(MetadataResult {
            output_path: input_path,
            overwritten: true,
        })
    }
}
