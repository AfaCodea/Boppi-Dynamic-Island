use crate::events::{emit_island_state_changed, emit_notification, NotificationPayload};
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

    // Expand native window immediately so the growing animation is never clipped
    if let Some(win) = app.get_webview_window("island") {
        let win_clone = win.clone();
        let _ = app.run_on_main_thread(move || {
            OverlayManager::resize_island(&win_clone, true);
        });
    }
    info!("Island expanded");
    Ok(())
}

#[tauri::command]
pub fn collapse_island(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let mut mode = state.0.mode.lock().map_err(|e| e.to_string())?;
    *mode = IslandMode::Compact;
    emit_island_state_changed(&app, IslandMode::Compact);

    // Smooth Collapse: Allow 320ms for CSS shrink animation to finish before clipping native window
    if let Some(win) = app.get_webview_window("island") {
        let win_clone = win.clone();
        let app_handle = app.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_millis(320)).await;
            let is_still_compact = {
                if let Some(s) = app_handle.try_state::<AppState>() {
                    let m = s.0.mode.lock().unwrap_or_else(|p| p.into_inner());
                    *m == IslandMode::Compact
                } else {
                    true
                }
            };
            if is_still_compact {
                let _ = app_handle.run_on_main_thread(move || {
                    OverlayManager::resize_island(&win_clone, false);
                });
            }
        });
    }
    info!("Island collapsed to compact");
    Ok(())
}

#[tauri::command]
pub fn toggle_island(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let current_mode = {
        let mode = state.0.mode.lock().map_err(|e| e.to_string())?;
        *mode
    };
    match current_mode {
        IslandMode::Compact | IslandMode::Hidden => expand_island(app, state),
        IslandMode::Expanded => collapse_island(app, state),
    }
}

#[tauri::command]
pub fn send_notification(
    app: AppHandle,
    title: String,
    message: String,
    category: Option<String>,
    action_label: Option<String>,
) -> Result<(), String> {
    let id = format!(
        "notif-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0)
    );
    let payload = NotificationPayload {
        id,
        title,
        message,
        category,
        time_label: Some("Now".to_string()),
        action_label,
    };
    emit_notification(&app, &payload);
    Ok(())
}

#[tauri::command]
pub fn show_pomodoro_hud(app: AppHandle) -> Result<(), String> {
    if let Some(hud) = app.get_webview_window("pomodoro-hud") {
        let hud_clone = hud.clone();
        let _ = app.run_on_main_thread(move || {
            let _ = hud_clone.show();
            OverlayManager::setup_overlay_window(&hud_clone);
            OverlayManager::bring_to_front(&hud_clone);
        });
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
pub fn position_lyrics_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("corner-lyrics") {
        let win_clone = win.clone();
        let _ = app.run_on_main_thread(move || {
            OverlayManager::setup_overlay_window(&win_clone);
        });
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
    // Reveal ambient Pomodoro HUD if not visible, and bring to front
    if let Some(hud) = app.get_webview_window("pomodoro-hud") {
        let hud_clone = hud.clone();
        let _ = app.run_on_main_thread(move || {
            let is_visible = hud_clone.is_visible().unwrap_or(false);
            let _ = hud_clone.show();
            if !is_visible {
                OverlayManager::setup_overlay_window(&hud_clone);
            }
            OverlayManager::bring_to_front(&hud_clone);
        });
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

#[tauri::command]
pub fn reset_timer(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    TimerService::stop(&app, &state);
    Ok(())
}

#[tauri::command]
pub fn add_timer_seconds(
    app: AppHandle,
    state: State<'_, AppState>,
    seconds: u64,
) -> Result<(), String> {
    TimerService::add_seconds(&app, &state, seconds);
    Ok(())
}

