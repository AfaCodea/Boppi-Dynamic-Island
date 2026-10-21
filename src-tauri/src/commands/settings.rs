use crate::services::theme::ThemeService;
use crate::state::{AppSettings, AppState, ThemePreference, ThemeState};
use tauri::{AppHandle, State};

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

#[tauri::command]
pub fn get_theme_state(state: State<'_, AppState>) -> Result<ThemeState, String> {
    let theme = state.0.theme.lock().map_err(|e| e.to_string())?;
    Ok(theme.clone())
}

#[tauri::command]
pub fn set_theme_preference(
    app: AppHandle,
    state: State<'_, AppState>,
    preference: ThemePreference,
) -> Result<ThemeState, String> {
    Ok(ThemeService::set_preference(&app, &state, preference))
}
