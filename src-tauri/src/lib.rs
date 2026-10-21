pub mod commands;
pub mod events;
pub mod native;
pub mod services;
pub mod state;

use crate::commands::island::{
    add_timer_seconds, collapse_island, expand_island, hide_pomodoro_hud, pause_timer,
    position_lyrics_overlay, reset_timer, send_notification, show_pomodoro_hud, start_timer,
    stop_timer, toggle_island,
};
use crate::commands::settings::{get_settings, get_theme_state, set_settings, set_theme_preference};
use crate::commands::system::{
    check_hardware_notch, get_battery_status, get_music_track, next_music_track, prev_music_track,
    seek_music, toggle_music,
};
use crate::native::macos::overlay::OverlayManager;
use crate::services::battery::BatteryService;
use crate::services::lock::LockScreenService;
use crate::services::music::MusicService;
use crate::services::theme::ThemeService;
use crate::state::AppState;
use tauri::Manager;
use tracing::info;

pub fn run() {
    tracing_subscriber::fmt::init();
    info!("Starting Boppi: A little bop above your apps...");

    let app_state = AppState::default();

    tauri::Builder::default()
        .manage(app_state.clone())
        .invoke_handler(tauri::generate_handler![
            expand_island,
            collapse_island,
            toggle_island,
            start_timer,
            pause_timer,
            stop_timer,
            reset_timer,
            add_timer_seconds,
            show_pomodoro_hud,
            hide_pomodoro_hud,
            position_lyrics_overlay,
            get_settings,
            set_settings,
            get_theme_state,
            set_theme_preference,
            get_battery_status,
            get_music_track,
            toggle_music,
            next_music_track,
            prev_music_track,
            seek_music,
            check_hardware_notch,
            send_notification,
        ])
        .setup(move |app| {
            #[cfg(target_os = "macos")]
            {
                let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            if let Some(window) = app.get_webview_window("island") {
                OverlayManager::setup_overlay_window(&window);
            } else {
                tracing::warn!("Could not find 'island' window");
            }

            if let Some(corner_window) = app.get_webview_window("corner-lyrics") {
                OverlayManager::setup_overlay_window(&corner_window);
            }

            if let Some(hud_window) = app.get_webview_window("pomodoro-hud") {
                OverlayManager::setup_overlay_window(&hud_window);
            }

            // Start live macOS Spotify/Apple Music bridge loop
            MusicService::start_playback_loop(app.handle().clone(), app_state.clone());

            // Start hardware battery telemetry loop
            BatteryService::start_battery_loop(app.handle().clone());

            // Start adaptive screen & app luminance contrast loop
            ThemeService::start_theme_loop(app.handle().clone(), app_state);

            // Start Smart Sleep & Wake monitor on macOS
            LockScreenService::start_lock_monitor(app.handle().clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
