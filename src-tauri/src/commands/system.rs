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

#[tauri::command]
pub fn check_hardware_notch() -> bool {
    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = std::process::Command::new("sysctl")
            .arg("-n")
            .arg("hw.model")
            .output()
        {
            let model = String::from_utf8_lossy(&output.stdout).trim().to_string();
            // MacBook models with built-in hardware camera notch (2021+ M-Series):
            // MacBookPro18,x (2021 M1 Pro/Max 14" & 16")
            // Mac14,2 (2022 M2 MacBook Air)
            // Mac14,5 / Mac14,6 / Mac14,9 / Mac14,10 (2023 M2 Pro/Max MacBook Pro)
            // Mac14,15 (2023 M2 15" MacBook Air)
            // Mac15,3 .. Mac15,11 (2023 M3 MacBook Pro 14" & 16")
            // Mac15,12 / Mac15,13 (2024 M3 MacBook Air)
            // Mac16,x (2024 M4 MacBook Pro)
            return model.starts_with("MacBookPro18,")
                || model.starts_with("Mac14,2")
                || model.starts_with("Mac14,5")
                || model.starts_with("Mac14,6")
                || model.starts_with("Mac14,9")
                || model.starts_with("Mac14,10")
                || model.starts_with("Mac14,15")
                || model.starts_with("Mac15,")
                || model.starts_with("Mac16,");
        }
    }

    false
}
