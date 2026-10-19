use tauri::WebviewWindow;
use tracing::{info, warn};

#[cfg(target_os = "macos")]
use objc2_app_kit::{NSColor, NSWindow, NSWindowCollectionBehavior};
#[cfg(target_os = "macos")]
use objc2_foundation::{MainThreadMarker, NSPoint, NSRect, NSSize};

pub struct OverlayManager;

impl OverlayManager {
    /// Configure the native NSWindow properties for a Dynamic Island or Corner Lyric overlay
    pub fn setup_overlay_window(window: &WebviewWindow) {
        let label = window.label().to_string();

        #[cfg(target_os = "macos")]
        {
            let ns_win_ptr = match window.ns_window() {
                Ok(ptr) => ptr as *mut NSWindow,
                Err(err) => {
                    warn!("Could not get NSWindow pointer: {:?}", err);
                    return;
                }
            };

            let Some(_mtm) = MainThreadMarker::new() else {
                warn!("Overlay setup must be run on the main thread");
                return;
            };

            // SAFETY:
            // 1. `ns_win_ptr` is provided directly by Tauri's window handle on macOS and points to a valid NSWindow.
            // 2. We verified that we are on the main thread via MainThreadMarker.
            // 3. Pointer dereference is valid for the duration of the setup configuration.
            unsafe {
                let ns_window: &NSWindow = &*ns_win_ptr;

                // 1. Transparent background & no shadow
                let clear_color = NSColor::clearColor();
                ns_window.setBackgroundColor(Some(&clear_color));
                ns_window.setOpaque(false);
                ns_window.setHasShadow(false);

                // 2. Window Level: NSStatusWindowLevel (25)
                ns_window.setLevel(25);

                // 3. Collection Behavior:
                // CanJoinAllSpaces (1 << 0) | IgnoresCycle (1 << 6) | FullScreenAuxiliary (1 << 8)
                // FullScreenAuxiliary (1 << 8) allows the window to appear on top of Fullscreen apps (Chrome, IDE, etc.)
                // For island, also add Stationary (1 << 4).
                let behavior_flags = if label == "corner-lyrics" || label == "pomodoro-hud" {
                    (1 << 0) | (1 << 6) | (1 << 8)
                } else {
                    (1 << 0) | (1 << 4) | (1 << 6) | (1 << 8)
                };
                let behavior = NSWindowCollectionBehavior(behavior_flags);
                ns_window.setCollectionBehavior(behavior);
                if label == "corner-lyrics" || label == "pomodoro-hud" {
                    ns_window.setMovable(true);
                }

                // 4. Position: center-top for island, top-right for lyrics, dead-center for pomodoro-hud
                if let Some(screen) = ns_window.screen() {
                    let screen_frame = screen.frame();
                    let window_frame = ns_window.frame();

                    let win_w = window_frame.size.width;
                    let win_h = window_frame.size.height;

                    let x = if label == "corner-lyrics" {
                        screen_frame.origin.x + screen_frame.size.width - win_w - 24.0
                    } else {
                        // Dead center horizontally for both island and pomodoro-hud
                        screen_frame.origin.x + (screen_frame.size.width - win_w) / 2.0
                    };

                    let y = if label == "corner-lyrics" {
                        screen_frame.origin.y + screen_frame.size.height - win_h - 40.0
                    } else if label == "pomodoro-hud" {
                        // Dead center vertically on the display
                        screen_frame.origin.y + (screen_frame.size.height - win_h) / 2.0
                    } else {
                        // Flush with top of screen under physical camera notch
                        screen_frame.origin.y + screen_frame.size.height - win_h
                    };

                    let new_frame = NSRect {
                        origin: NSPoint { x, y },
                        size: NSSize {
                            width: win_w,
                            height: win_h,
                        },
                    };
                    ns_window.setFrame_display(new_frame, true);
                }

                // 5. Order front without stealing key focus (don't show pomodoro-hud until user triggers timer)
                if label != "pomodoro-hud" {
                    ns_window.orderFrontRegardless();
                }
            }

            info!("macOS overlay for '{}' configured successfully", label);
        }

        #[cfg(not(target_os = "macos"))]
        {
            let _ = window.set_always_on_top(true);
            info!("Non-macOS fallback overlay configured for '{}'", label);
        }
    }

    /// Bring overlay window to front without stealing active keyboard focus
    pub fn bring_to_front(window: &WebviewWindow) {
        #[cfg(target_os = "macos")]
        {
            if let Ok(ptr) = window.ns_window() {
                unsafe {
                    let ns_window = &*(ptr as *mut NSWindow);
                    ns_window.orderFrontRegardless();
                }
            }
        }
    }
}
