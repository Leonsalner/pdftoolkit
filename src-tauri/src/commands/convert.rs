use serde::Serialize;
use tauri_plugin_shell::ShellExt;
use lopdf::Document;
use crate::utils::paths::get_output_dir;
use crate::utils::validation::validate_pdf;

#[derive(Serialize)]
pub struct ConvertResult {
    pub output_path: String,
    pub pages_converted: u32,
    pub output_mode: String,
}

#[tauri::command]
pub async fn convert_pdf_to_images(
    app: tauri::AppHandle,
    input_path: String,
    format: String,
    ranges: Option<String>,
    output_mode: String,
    output_name: Option<String>,
) -> Result<ConvertResult, String> {
    validate_pdf(&input_path)?;
    
    let doc = Document::load(&input_path).map_err(|e| format!("Failed to read PDF: {}", e))?;
    let total_pages = doc.get_pages().len() as u32;

    let mut pages_to_convert = Vec::new();
    if let Some(r) = &ranges {
        if !r.trim().is_empty() {
            let parts = r.split(',');
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
                        pages_to_convert.push(p);
                    }
                } else {
                    let p = part.parse::<u32>().map_err(|_| format!("Invalid range '{}': Not a number", part))?;
                    if p < 1 || p > total_pages {
                        return Err(format!("Invalid range '{}': Out of bounds", part));
                    }
                    pages_to_convert.push(p);
                }
            }
        }
    }
    
    if pages_to_convert.is_empty() {
        for p in 1..=total_pages {
            pages_to_convert.push(p);
        }
    }
    
    pages_to_convert.sort();
    pages_to_convert.dedup();

    let timestamp = std::time::UNIX_EPOCH.elapsed().map_err(|e| format!("System time error: {}", e))?.as_millis();
    let temp_dir = std::env::temp_dir().join(format!("pdf_toolkit_convert_{}", timestamp));
    std::fs::create_dir_all(&temp_dir).map_err(|e| format!("Failed to create temp dir: {}", e))?;

    let device = if format.to_lowercase() == "jpeg" || format.to_lowercase() == "jpg" {
        "-sDEVICE=jpeg"
    } else {
        "-sDEVICE=png16m"
    };

    let ext = if format.to_lowercase() == "jpeg" || format.to_lowercase() == "jpg" {
        "jpg"
    } else {
        "png"
    };

    for &page in &pages_to_convert {
        let output_file = temp_dir.join(format!("page_{:03}.{}", page, ext));
        let output_str = output_file.to_string_lossy().to_string();

        let mut args = vec![
            "-dNOPAUSE",
            "-dBATCH",
            "-dQUIET",
            device,
            "-r200",
        ];
        if ext == "jpg" {
            args.push("-dJPEGQ=85");
        }
        
        let first_page_arg = format!("-dFirstPage={}", page);
        let last_page_arg = format!("-dLastPage={}", page);
        let output_arg = format!("-sOutputFile={}", output_str);
        
        args.push(&first_page_arg);
        args.push(&last_page_arg);
        args.push("-dFitPage");
        args.push(&output_arg);
        args.push(&input_path);

        let gs_output = app.shell().sidecar("gs")
            .map_err(|e| format!("Failed to initialize Ghostscript sidecar: {}", e))?
            .args(args)
            .output()
            .await
            .map_err(|e| format!("Failed to execute Ghostscript: {}", e))?;

        if !gs_output.status.success() {
            let _ = std::fs::remove_dir_all(&temp_dir);
            return Err("Failed to convert PDF to images. The document might be corrupted or protected.".to_string());
        }
    }

    let out_dir = get_output_dir(&app)?;
    let stem_name = match output_name {
        Some(name) if !name.trim().is_empty() => name,
        _ => {
            let path = std::path::Path::new(&input_path);
            path.file_stem().unwrap_or_default().to_string_lossy().into_owned()
        }
    };

    let final_output_path;

    if output_mode == "subfolder" {
        let subfolder = out_dir.join(&stem_name);
        if !subfolder.exists() {
            std::fs::create_dir_all(&subfolder).map_err(|e| format!("Failed to create output subfolder: {}", e))?;
        }
        
        for &page in &pages_to_convert {
            let src = temp_dir.join(format!("page_{:03}.{}", page, ext));
            let dest = subfolder.join(format!("page_{:03}.{}", page, ext));
            std::fs::copy(&src, &dest).map_err(|e| format!("Failed to copy file: {}", e))?;
        }
        final_output_path = subfolder.to_string_lossy().to_string();
    } else if output_mode == "zip" {
        let zip_path = out_dir.join(format!("{}.zip", stem_name));
        if zip_path.exists() {
            let _ = std::fs::remove_dir_all(&temp_dir);
            return Err("Output zip file already exists.".to_string());
        }
        
        let file = std::fs::File::create(&zip_path).map_err(|e| format!("Failed to create zip file: {}", e))?;
        let mut zip = zip::ZipWriter::new(file);
        let options = zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
        
        for &page in &pages_to_convert {
            let src = temp_dir.join(format!("page_{:03}.{}", page, ext));
            let file_name = format!("page_{:03}.{}", page, ext);
            zip.start_file(&file_name, options.clone()).map_err(|e| format!("Failed to add to zip: {}", e))?;
            let mut f = std::fs::File::open(&src).map_err(|e| format!("Failed to open temp image: {}", e))?;
            std::io::copy(&mut f, &mut zip).map_err(|e| format!("Failed to write to zip: {}", e))?;
        }
        zip.finish().map_err(|e| format!("Failed to finish zip file: {}", e))?;
        final_output_path = zip_path.to_string_lossy().to_string();
    } else {
        let _ = std::fs::remove_dir_all(&temp_dir);
        return Err(format!("Invalid output mode: {}", output_mode));
    }

    let _ = std::fs::remove_dir_all(&temp_dir);

    Ok(ConvertResult {
        output_path: final_output_path,
        pages_converted: pages_to_convert.len() as u32,
        output_mode,
    })
}
