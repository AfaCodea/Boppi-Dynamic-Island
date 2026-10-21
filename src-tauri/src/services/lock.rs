use crate::events::emit_system_sleep_state;
use crate::native::macos::overlay::OverlayManager;
use std::process::Command;
use std::time::Duration;
use tauri::{AppHandle, Manager};
use tokio::time::sleep;
use tracing::info;

pub struct LockScreenService;

impl LockScreenService {
    /// Detect if the macOS user console session is currently locked
    pub fn is_screen_locked() -> bool {
        #[cfg(target_os = "macos")]
        {
            if let Ok(output) = Command::new("ioreg").args(["-n", "Root", "-d1"]).output() {
                let text = String::from_utf8_lossy(&output.stdout);
                if text.contains("\"IOConsoleLocked\" = Yes") {
                    return true;
                }
            }
        }
        false
    }

    /// Background loop monitoring lock and unlock events for Smart Sleep & Wake
    pub fn start_lock_monitor(app: AppHandle) {
        tauri::async_runtime::spawn(async move {
            let mut was_locked = false;

            loop {
                let is_locked = tokio::task::spawn_blocking(Self::is_screen_locked)
                    .await
                    .unwrap_or(false);

                if is_locked != was_locked {
                    was_locked = is_locked;
                    info!("macOS Lock state changed: is_locked={}", is_locked);
                    emit_system_sleep_state(&app, is_locked);

                    let app_handle = app.clone();
                    let _ = app.run_on_main_thread(move || {
                        if is_locked {
                            // Smart Sleep: hide overlay windows while screen is locked
                            if let Some(island) = app_handle.get_webview_window("island") {
                                let _ = island.hide();
                            }
                            if let Some(lyrics) = app_handle.get_webview_window("corner-lyrics") {
                                let _ = lyrics.hide();
                            }
                            if let Some(hud) = app_handle.get_webview_window("pomodoro-hud") {
                                let _ = hud.hide();
                            }
                        } else {
                            // Smart Wake: restore and bring overlay window to front
                            if let Some(island) = app_handle.get_webview_window("island") {
                                let _ = island.show();
                                OverlayManager::setup_overlay_window(&island);
                                OverlayManager::bring_to_front(&island);
                            }
                        }
                    });
                }

                // Poll every 1s when active, 1.5s when locked to conserve battery
                let interval = if was_locked { 1500 } else { 1000 };
                sleep(Duration::from_millis(interval)).await;
            }
        });
    }
}
