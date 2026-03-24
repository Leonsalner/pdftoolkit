pub mod commands;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::compress::compress_pdf,
            commands::compress::check_ghostscript,
            commands::compress::get_file_size,
            commands::extract::extract_pages,
            commands::extract::get_pdf_page_count,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}