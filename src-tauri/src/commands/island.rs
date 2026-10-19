use crate::events::emit_island_state_changed;
use crate::native::macos::overlay::OverlayManager;
use crate::services::timer::TimerService;
use crate::state::{AppState, IslandMode};
use tauri::{AppHandle, Manager, State};
use tracing::info;

#[tauri::command]
pub fn expand_island(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let mut mode = state.0.mode.lock().map_err(|e| e.to_string())?;
    *mode = IslandMode::Expanded;
    emit_island_state_changed(&app, IslandMode::Expanded);
    info!("Island expanded");
    Ok(())
}

#[tauri::command]
pub fn collapse_island(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let mut mode = state.0.mode.lock().map_err(|e| e.to_string())?;
    *mode = IslandMode::Compact;
    emit_island_state_changed(&app, IslandMode::Compact);
    info!("Island collapsed to compact");
    Ok(())
}

#[tauri::command]
pub fn toggle_island(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let mut mode = state.0.mode.lock().map_err(|e| e.to_string())?;
    let next_mode = match *mode {
        IslandMode::Compact => IslandMode::Expanded,
        IslandMode::Expanded => IslandMode::Compact,
        IslandMode::Hidden => IslandMode::Compact,
    };
    *mode = next_mode;
    emit_island_state_changed(&app, next_mode);
    info!("Island toggled to {:?}", next_mode);
    Ok(())
}

#[tauri::command]
pub fn show_pomodoro_hud(app: AppHandle) -> Result<(), String> {
    if let Some(hud) = app.get_webview_window("pomodoro-hud") {
        OverlayManager::bring_to_front(&hud);
        let _ = hud.show();
        info!("Pomodoro HUD displayed on screen");
    }
    Ok(())
}

#[tauri::command]
pub fn hide_pomodoro_hud(app: AppHandle) -> Result<(), String> {
    if let Some(hud) = app.get_webview_window("pomodoro-hud") {
        let _ = hud.hide();
        info!("Pomodoro HUD hidden");
    }
    Ok(())
}

#[tauri::command]
pub fn start_timer(
    app: AppHandle,
    state: State<'_, AppState>,
    duration_seconds: u64,
    label: String,
) -> Result<(), String> {
    // Automatically reveal ambient Pomodoro HUD in the center of the screen
    if let Some(hud) = app.get_webview_window("pomodoro-hud") {
        OverlayManager::bring_to_front(&hud);
        let _ = hud.show();
    }
    TimerService::start(app, (*state).clone(), duration_seconds, label);
    Ok(())
}

#[tauri::command]
pub fn pause_timer(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    TimerService::pause(&app, &state);
    Ok(())
}

#[tauri::command]
pub fn stop_timer(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    TimerService::stop(&app, &state);
    if let Some(hud) = app.get_webview_window("pomodoro-hud") {
        let _ = hud.hide();
    }
    Ok(())
}
