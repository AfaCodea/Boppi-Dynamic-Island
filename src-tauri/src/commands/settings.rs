use crate::state::{AppSettings, AppState};
use tauri::State;

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.0.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub fn set_settings(state: State<'_, AppState>, new_settings: AppSettings) -> Result<(), String> {
    let mut settings = state.0.settings.lock().map_err(|e| e.to_string())?;
    *settings = new_settings;
    Ok(())
}
