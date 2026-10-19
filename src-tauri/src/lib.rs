pub mod commands;
pub mod events;
pub mod native;
pub mod services;
pub mod state;

use crate::commands::island::{
    collapse_island, expand_island, pause_timer, start_timer, stop_timer, toggle_island,
};
use crate::commands::settings::{get_settings, set_settings};
use crate::commands::system::{
    get_battery_status, get_music_track, next_music_track, prev_music_track, seek_music,
    toggle_music,
};
use crate::native::macos::overlay::OverlayManager;
use crate::services::battery::BatteryService;
use crate::services::music::MusicService;
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
            get_settings,
            set_settings,
            get_battery_status,
            get_music_track,
            toggle_music,
            next_music_track,
            prev_music_track,
            seek_music,
        ])
        .setup(move |app| {
            if let Some(window) = app.get_webview_window("island") {
                OverlayManager::setup_overlay_window(&window);
            } else {
                tracing::warn!("Could not find 'island' window");
            }

            if let Some(corner_window) = app.get_webview_window("corner-lyrics") {
                OverlayManager::setup_overlay_window(&corner_window);
            }

            // Start live macOS Spotify/Apple Music bridge loop
            MusicService::start_playback_loop(app.handle().clone(), app_state);

            // Start hardware battery telemetry loop
            BatteryService::start_battery_loop(app.handle().clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
