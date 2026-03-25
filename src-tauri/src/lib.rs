pub mod commands;
pub mod utils;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            app.manage(commands::ai::AiState {
                server_process: std::sync::Mutex::new(None),
            });
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::ai::get_ai_specs,
            commands::ai::check_model_exists,
            commands::ai::check_ai_tools_exists,
            commands::ai::download_model,
            commands::ai::download_ai_tools,
            commands::ai::start_ai_server,
            commands::ai::stop_ai_server,
            commands::compress::compress_pdf,
            commands::compress::check_ghostscript,
            commands::compress::get_file_size,
            commands::convert::convert_pdf_to_images,
            commands::extract::extract_pages,
            commands::extract::get_pdf_page_count,
            commands::merge::merge_pdfs,
            commands::metadata::get_pdf_metadata,
            commands::metadata::set_pdf_metadata,
            commands::security::add_pdf_security,
            commands::security::decrypt_pdf,
            commands::security::check_pdf_encrypted,
            commands::sign::detect_smart_cards,
            commands::sign::sign_pdf_file_based,
            commands::watermark::add_text_watermark,
            commands::ocr::extract_text_ocr,
            commands::ocr::make_searchable_pdf,
            commands::split::split_pdf,
            commands::organize::generate_page_thumbnails,
            commands::organize::save_organized_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
