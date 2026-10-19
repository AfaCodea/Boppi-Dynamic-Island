use crate::services::battery::BatteryService;
use crate::services::music::MusicService;
use crate::state::{AppState, BatteryState, MusicState};
use tauri::{AppHandle, State};

#[tauri::command]
pub fn get_battery_status() -> Result<BatteryState, String> {
    Ok(BatteryService::read_status())
}

#[tauri::command]
pub fn get_music_track(state: State<'_, AppState>) -> Result<MusicState, String> {
    Ok(MusicService::get_current_track(&state))
}

#[tauri::command]
pub fn toggle_music(app: AppHandle, state: State<'_, AppState>) -> Result<MusicState, String> {
    Ok(MusicService::toggle_playback(&app, &state))
}

#[tauri::command]
pub fn next_music_track(app: AppHandle, state: State<'_, AppState>) -> Result<MusicState, String> {
    Ok(MusicService::next_track(&app, &state))
}

#[tauri::command]
pub fn prev_music_track(app: AppHandle, state: State<'_, AppState>) -> Result<MusicState, String> {
    Ok(MusicService::prev_track(&app, &state))
}

#[tauri::command]
pub fn seek_music(
    app: AppHandle,
    state: State<'_, AppState>,
    seconds: u64,
) -> Result<MusicState, String> {
    Ok(MusicService::seek_playback(&app, &state, seconds))
}
