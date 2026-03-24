pub mod commands;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::compress::compress_pdf,
            commands::compress::check_ghostscript,
            commands::compress::get_file_size,
            commands::extract::extract_pages,
            commands::extract::get_pdf_page_count,
            commands::merge::merge_pdfs,
            commands::ocr::extract_text_ocr,
            commands::split::split_pdf,
            commands::organize::generate_page_thumbnails,
            commands::organize::save_organized_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}