use tauri::{AppHandle, State, Manager};
use tauri_plugin_shell::ShellExt;
use serde::Serialize;
use std::sync::Mutex;

pub struct AiState {
    pub server_process: Mutex<Option<tauri_plugin_shell::process::CommandChild>>,
}

#[derive(Serialize)]
pub struct SystemSpecs {
    pub ram_gb: u32,
    pub recommended_model: String,
    pub model_url: String,
}

#[tauri::command]
pub async fn get_ai_specs() -> Result<SystemSpecs, String> {
    let output = std::process::Command::new("sysctl")
        .args(["-n", "hw.memsize"])
        .output()
        .map_err(|e| e.to_string())?;
    
    let mem_bytes: u64 = String::from_utf8_lossy(&output.stdout).trim().parse().unwrap_or(8 * 1024 * 1024 * 1024);
    let ram_gb = (mem_bytes / (1024 * 1024 * 1024)) as u32;

    let (recommended_model, model_url) = if ram_gb >= 32 {
        ("Qwen2.5-7B-Instruct.gguf", "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/main/qwen2.5-7b-instruct-q4_k_m.gguf")
    } else if ram_gb >= 16 {
        ("Qwen2.5-3B-Instruct.gguf", "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf")
    } else {
        ("Qwen2.5-1.5B-Instruct.gguf", "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf")
    };

    Ok(SystemSpecs {
        ram_gb,
        recommended_model: recommended_model.to_string(),
        model_url: model_url.to_string(),
    })
}

#[tauri::command]
pub async fn check_model_exists(app: AppHandle, model_name: String) -> Result<bool, String> {
    let app_dir = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("/tmp"));
    let model_path = app_dir.join(&model_name);
    Ok(model_path.exists())
}

#[tauri::command]
pub async fn download_model(app: AppHandle, url: String, model_name: String) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("/tmp"));
    std::fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    let model_path = app_dir.join(&model_name);
    if model_path.exists() {
        return Ok("Already exists".into());
    }

    let output = app.shell().command("curl")
        .args(["-L", &url, "-o", &model_path.to_string_lossy()])
        .output()
        .await
        .map_err(|e| format!("Failed to run curl: {}", e))?;

    if !output.status.success() {
        return Err("Download failed".to_string());
    }

    Ok("Downloaded".into())
}

#[tauri::command]
pub async fn start_ai_server(app: AppHandle, state: State<'_, AiState>, model_name: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("/tmp"));
    let model_path = app_dir.join(&model_name);

    if !model_path.exists() {
        return Err("Model not found".into());
    }

    let mut process_guard = state.server_process.lock().map_err(|e| format!("Mutex lock failed: {}", e))?;
    if let Some(child) = process_guard.take() {
        let _ = child.kill();
    }

    let (_rx, child) = app.shell().sidecar("llama-server")
        .map_err(|e| format!("Failed to initialize llama-server sidecar: {}", e))?
        .args([
            "--model", &model_path.to_string_lossy(),
            "--port", "8080",
            "--ctx-size", "4096",
            "--n-predict", "1024",
            "--threads", "4",
        ])
        .spawn()
        .map_err(|e| format!("Failed to spawn AI server: {}", e))?;

    *process_guard = Some(child);

    // Give the server a moment to bind to the port
    std::thread::sleep(std::time::Duration::from_secs(2));

    Ok(())
}

#[tauri::command]
pub async fn stop_ai_server(state: State<'_, AiState>) -> Result<(), String> {
    let mut process_guard = state.server_process.lock().map_err(|e| format!("Mutex lock failed: {}", e))?;
    if let Some(child) = process_guard.take() {
        let _ = child.kill();
    }
    Ok(())
}
