use crate::events::emit_theme_changed;
use crate::state::{AppState, ResolvedTheme, ThemePreference, ThemeState};
use std::process::Command;
use std::time::Duration;
use tauri::AppHandle;
use tokio::time::sleep;

/// Known dark-first applications on macOS (IDEs, Terminals, Media, Creative Suites)
const DARK_SURFACE_APPS: &[&str] = &[
    "iterm",
    "terminal",
    "warp",
    "alacritty",
    "kitty",
    "ghostty",
    "hyper",
    "wezterm",
    "code",
    "visual studio code",
    "cursor",
    "windsurf",
    "zed",
    "sublime text",
    "xcode",
    "android studio",
    "intellij",
    "webstorm",
    "pycharm",
    "clion",
    "goland",
    "rustrover",
    "neovide",
    "vim",
    "spotify",
    "discord",
    "steam",
    "figma",
    "final cut",
    "davinci resolve",
    "logic pro",
    "ableton",
    "blender",
    "unity",
    "unreal",
    "obs",
    "vlc",
    "iina",
    "quicktime",
    "mpv",
    "plex",
    "photoshop",
    "illustrator",
    "premiere",
    "after effects",
    "lightroom",
    "cinema 4d",
    "docker",
    "postman",
    "insomnia",
    "tableplus",
    "dbeaver",
    "linear",
    "raycast",
];

/// Known light-first document & productivity applications on macOS
const LIGHT_SURFACE_APPS: &[&str] = &[
    "pages",
    "numbers",
    "keynote",
    "microsoft word",
    "microsoft excel",
    "microsoft powerpoint",
    "onenote",
    "notes",
    "reminders",
    "freeform",
    "preview",
    "textedit",
    "stickies",
    "calendar",
    "mail",
    "contacts",
    "maps",
    "books",
    "news",
    "stocks",
    "dictionary",
    "calculator",
];

pub struct ThemeService;

impl ThemeService {
    /// Detect the frontmost external application and its surface luminance on macOS.
    /// Returns `Some((app_name, is_dark_surface, luminance_score))` or `None` if Boppi itself is focused.
    pub fn detect_environment_context(
        last_asn: &mut String,
        cached: &mut Option<(String, bool, f32)>,
    ) -> Option<(String, bool, f32)> {
        #[cfg(target_os = "macos")]
        {
            // 1. Query frontmost application ASN via native `lsappinfo` (< 5ms)
            let front_asn = Command::new("lsappinfo").arg("front").output().ok()?;
            let asn_str = String::from_utf8_lossy(&front_asn.stdout).trim().to_string();
            if asn_str.is_empty() {
                return None;
            }

            // If frontmost application hasn't changed, return cached detection immediately
            if *last_asn == asn_str && cached.is_some() {
                return cached.clone();
            }

            let info_out = Command::new("lsappinfo")
                .args(["info", "-only", "name", "-only", "bundleid", &asn_str])
                .output()
                .ok()?;
            let info_text = String::from_utf8_lossy(&info_out.stdout);

            let mut app_name = String::new();
            let mut bundle_id = String::new();

            for line in info_text.lines() {
                if let Some((k, v)) = line.split_once('=') {
                    let key = k.trim().trim_matches('"');
                    let val = v.trim().trim_matches('"');
                    if key == "LSDisplayName" || key == "CFBundleName" {
                        app_name = val.to_string();
                    } else if key == "CFBundleIdentifier" {
                        bundle_id = val.to_string();
                    }
                }
            }

            let lower_name = app_name.to_lowercase();
            let lower_bundle = bundle_id.to_lowercase();

            // Ignore when the user clicks on Boppi's own overlay windows so color never flickers
            if lower_name.contains("dynamic-island")
                || lower_name.contains("boppi")
                || lower_bundle.contains("dynamic")
                || lower_bundle.contains("boppi")
            {
                return None;
            }

            *last_asn = asn_str;

            // 2. Check if app is explicitly known to be a Dark-Surface app
            let is_known_dark = DARK_SURFACE_APPS
                .iter()
                .any(|kw| lower_name.contains(kw) || lower_bundle.contains(kw));
            if is_known_dark {
                let res = (app_name, true, 0.10);
                *cached = Some(res.clone());
                return Some(res);
            }

            // 3. Check if app is explicitly known to be a Light-Surface document app
            let is_known_light = LIGHT_SURFACE_APPS
                .iter()
                .any(|kw| lower_name.contains(kw) || lower_bundle.contains(kw));
            if is_known_light {
                // Verify if system is in Dark Mode for Apple apps that adapt (like Notes/Mail/Calendar/Preview)
                let is_system_dark = Self::is_macos_dark_mode();
                let adapts_to_system = ["notes", "reminders", "calendar", "mail", "maps", "books"]
                    .iter()
                    .any(|kw| lower_name.contains(kw));
                let res = if adapts_to_system && is_system_dark {
                    (app_name, true, 0.14)
                } else {
                    (app_name, false, 0.88)
                };
                *cached = Some(res.clone());
                return Some(res);
            }

            // 4. For System-Adaptive apps (Finder, Safari, Chrome, Arc, Brave, System Settings, etc.)
            // Check per-app Aqua override first, then global AppleInterfaceStyle
            if !bundle_id.is_empty() {
                if let Ok(aqua_out) = Command::new("defaults")
                    .args(["read", &bundle_id, "NSRequiresAquaSystemAppearance"])
                    .output()
                {
                    let val = String::from_utf8_lossy(&aqua_out.stdout).trim().to_string();
                    if val == "1" || val.eq_ignore_ascii_case("true") {
                        let res = (app_name, false, 0.85);
                        *cached = Some(res.clone());
                        return Some(res);
                    }
                }
            }

            let system_dark = Self::is_macos_dark_mode();
            let lum = if system_dark { 0.15 } else { 0.85 };
            let display_name = if app_name.is_empty() {
                "macOS".to_string()
            } else {
                app_name
            };
            let res = (display_name, system_dark, lum);
            *cached = Some(res.clone());
            return Some(res);
        }

        #[cfg(not(target_os = "macos"))]
        {
            Some(("Desktop".to_string(), true, 0.12))
        }
    }

    #[cfg(target_os = "macos")]
    fn is_macos_dark_mode() -> bool {
        if let Ok(output) = Command::new("defaults")
            .args(["read", "-g", "AppleInterfaceStyle"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            return stdout.trim().eq_ignore_ascii_case("dark");
        }
        false
    }

    /// Resolve Boppi's UI theme based on user preference and background luminance:
    /// - In `Auto` mode (Best Practice Adaptive Contrast):
    ///   * Dark/Black app background -> Boppi turns `Light` (White UI) for maximum contrast.
    ///   * Light/White app background -> Boppi turns `Dark` (Black UI) for maximum contrast.
    pub fn resolve_theme(pref: ThemePreference, is_dark_background: bool) -> ResolvedTheme {
        match pref {
            ThemePreference::Auto => {
                if is_dark_background {
                    ResolvedTheme::Light // White Boppi on Black App
                } else {
                    ResolvedTheme::Dark // Black Boppi on White App
                }
            }
            ThemePreference::Light => ResolvedTheme::Light,
            ThemePreference::Dark => ResolvedTheme::Dark,
        }
    }

    /// Update theme preference manually or automatically and broadcast to all windows
    pub fn set_preference(
        app: &AppHandle,
        state: &AppState,
        preference: ThemePreference,
    ) -> ThemeState {
        let updated = {
            let mut theme = state
                .0
                .theme
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());
            theme.preference = preference;
            let is_dark_bg = theme.background_luminance == "dark";
            theme.resolved_theme = Self::resolve_theme(preference, is_dark_bg);
            theme.clone()
        };

        if let Ok(mut settings) = state.0.settings.lock() {
            settings.theme_preference = preference;
        }

        emit_theme_changed(app, &updated);
        updated
    }

    /// Background loop monitoring active application, screen changes, and adaptive contrast
    pub fn start_theme_loop(app: AppHandle, state: AppState) {
        tauri::async_runtime::spawn(async move {
            let mut last_resolved = ResolvedTheme::Light;
            let mut last_app = String::new();
            let mut last_pref = ThemePreference::Auto;
            let mut last_asn = String::new();
            let mut cached_result: Option<(String, bool, f32)> = None;

            loop {
                let mut current_asn = last_asn.clone();
                let mut current_cached = cached_result.clone();

                let context = tokio::task::spawn_blocking(move || {
                    let res = Self::detect_environment_context(&mut current_asn, &mut current_cached);
                    (res, current_asn, current_cached)
                })
                .await
                .unwrap_or((None, last_asn.clone(), cached_result.clone()));

                let (detected, new_asn, new_cached) = context;
                last_asn = new_asn;
                cached_result = new_cached;

                let maybe_emit = {
                    let mut theme = state
                        .0
                        .theme
                        .lock()
                        .unwrap_or_else(|poisoned| poisoned.into_inner());

                    if let Some((app_name, is_dark_bg, lum_score)) = detected {
                        theme.active_app = app_name;
                        theme.background_luminance = if is_dark_bg {
                            "dark".to_string()
                        } else {
                            "light".to_string()
                        };
                        theme.luminance_score = lum_score;
                    }

                    let is_dark_bg = theme.background_luminance == "dark";
                    theme.resolved_theme = Self::resolve_theme(theme.preference, is_dark_bg);

                    let changed = theme.resolved_theme != last_resolved
                        || theme.active_app != last_app
                        || theme.preference != last_pref;

                    if changed {
                        last_resolved = theme.resolved_theme;
                        last_app = theme.active_app.clone();
                        last_pref = theme.preference;
                        Some(theme.clone())
                    } else {
                        None
                    }
                };

                if let Some(payload) = maybe_emit {
                    emit_theme_changed(&app, &payload);
                }

                sleep(Duration::from_millis(1200)).await;
            }
        });
    }
}
