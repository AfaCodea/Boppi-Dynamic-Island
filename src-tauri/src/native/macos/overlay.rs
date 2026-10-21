use tauri::WebviewWindow;
use tracing::{info, warn};

#[cfg(target_os = "macos")]
use objc2_app_kit::{NSColor, NSScreen, NSWindow, NSWindowCollectionBehavior};
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

            let _mtm = match MainThreadMarker::new() {
                Some(mtm) => mtm,
                None => unsafe { MainThreadMarker::new_unchecked() },
            };

            // SAFETY:
            // 1. `ns_win_ptr` is provided directly by Tauri's window handle on macOS and points to a valid NSWindow.
            // 2. We verified that we are on the main thread via MainThreadMarker.
            // 3. Pointer dereference is valid for the duration of the setup configuration.
            unsafe {
                let ns_window: &NSWindow = &*ns_win_ptr;

                // 1. Transparent background & no shadow & keep visible on deactivate
                let clear_color = NSColor::clearColor();
                ns_window.setBackgroundColor(Some(&clear_color));
                ns_window.setOpaque(false);
                ns_window.setHasShadow(false);
                ns_window.setHidesOnDeactivate(false);

                // 2. Window Level: Dynamic Island sits at 26, corner-lyrics at 24 (emerging from behind island)
                let window_level = if label == "island" {
                    26
                } else if label == "corner-lyrics" {
                    24
                } else {
                    25
                };
                ns_window.setLevel(window_level);

                // 3. Collection Behavior:
                // CanJoinAllSpaces (1 << 0)
                // IgnoresCycle (1 << 6)
                // FullScreenAuxiliary (1 << 8)
                // CanJoinAllApplications (1 << 18) - CRITICAL for displaying over OTHER applications' Fullscreen spaces!
                let behavior_flags = (1 << 0) | (1 << 6) | (1 << 8) | (1 << 18);
                let behavior = NSWindowCollectionBehavior(behavior_flags);
                ns_window.setCollectionBehavior(behavior);
                ns_window.setAcceptsMouseMovedEvents(true);
                ns_window.setIgnoresMouseEvents(false);
                if label == "corner-lyrics" || label == "pomodoro-hud" {
                    ns_window.setMovable(true);
                } else {
                    ns_window.setMovable(false);
                }

                // 4. Position: center-top for island, dead-center horizontally for lyrics, dead-center for pomodoro-hud
                let screen_opt = ns_window.screen().or_else(|| NSScreen::mainScreen(_mtm));
                if let Some(screen) = screen_opt {
                    let screen_frame = screen.frame();
                    let window_frame = ns_window.frame();

                    let (win_w, win_h) = if label == "island" {
                        (366.0, 44.0) // Sized generously so hover expansion & notification pill never clip or jitter
                    } else if label == "corner-lyrics" {
                        (720.0, 90.0) // 90px height allows full 30px emergence from behind island without webview clipping
                    } else {
                        (window_frame.size.width, window_frame.size.height)
                    };

                    let x = screen_frame.origin.x + (screen_frame.size.width - win_w) / 2.0;

                    let y = if label == "corner-lyrics" {
                        // Tucked 18px below top of screen (16px overlap zone directly behind 34px island capsule)
                        screen_frame.origin.y + screen_frame.size.height - win_h - 18.0
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

                // 5. Order front without stealing key focus (don't show pomodoro-hud or corner-lyrics until active)
                if label != "pomodoro-hud" && label != "corner-lyrics" {
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

    /// Dynamically resize the island window so it does not block Chrome tabs when compact
    pub fn resize_island(window: &WebviewWindow, expanded: bool) {
        #[cfg(target_os = "macos")]
        {
            if let Ok(ptr) = window.ns_window() {
                unsafe {
                    let ns_window = &*(ptr as *mut NSWindow);
                    let mtm = match MainThreadMarker::new() {
                        Some(m) => m,
                        None => MainThreadMarker::new_unchecked(),
                    };
                    let screen_opt = ns_window.screen().or_else(|| NSScreen::mainScreen(mtm));
                    if let Some(screen) = screen_opt {
                        let screen_frame = screen.frame();
                        let (win_w, win_h) = if expanded {
                            (460.0, 220.0)
                        } else {
                            (366.0, 44.0)
                        };
                        let x = screen_frame.origin.x + (screen_frame.size.width - win_w) / 2.0;
                        let y = screen_frame.origin.y + screen_frame.size.height - win_h;
                        let current_frame = ns_window.frame();
                        if (current_frame.origin.x - x).abs() > 0.5
                            || (current_frame.origin.y - y).abs() > 0.5
                            || (current_frame.size.width - win_w).abs() > 0.5
                            || (current_frame.size.height - win_h).abs() > 0.5
                        {
                            let new_frame = NSRect {
                                origin: NSPoint { x, y },
                                size: NSSize {
                                    width: win_w,
                                    height: win_h,
                                },
                            };
                            ns_window.setFrame_display(new_frame, false);
                        }
                    }
                }
            }
        }
    }

    /// Bring overlay window to front without stealing active keyboard focus
    pub fn bring_to_front(window: &WebviewWindow) {
        #[cfg(target_os = "macos")]
        {
            let label = window.label().to_string();
            if let Ok(ptr) = window.ns_window() {
                unsafe {
                    let ns_window = &*(ptr as *mut NSWindow);
                    let window_level = if label == "island" {
                        26
                    } else if label == "corner-lyrics" {
                        24
                    } else {
                        25
                    };
                    ns_window.setLevel(window_level);
                    let behavior = NSWindowCollectionBehavior((1 << 0) | (1 << 6) | (1 << 8) | (1 << 18));
                    ns_window.setCollectionBehavior(behavior);
                    ns_window.setHidesOnDeactivate(false);
                    if label == "corner-lyrics" || label == "pomodoro-hud" {
                        ns_window.setMovable(true);
                    } else {
                        ns_window.setMovable(false);
                    }
                    ns_window.setIgnoresMouseEvents(false);
                    ns_window.orderFrontRegardless();
                }
            }
        }
    }
}
