use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum IslandMode {
    #[default]
    Compact,
    Expanded,
    Hidden,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimerState {
    pub running: bool,
    pub paused: bool,
    pub remaining_seconds: u64,
    pub total_seconds: u64,
    pub label: String,
    #[serde(skip)]
    pub end_instant: Option<Instant>,
    #[serde(skip)]
    pub generation: u64,
}

impl Default for TimerState {
    fn default() -> Self {
        Self {
            running: false,
            paused: false,
            remaining_seconds: 25 * 60,
            total_seconds: 25 * 60,
            label: "Pomodoro Focus".to_string(),
            end_instant: None,
            generation: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LyricLine {
    pub id: usize,
    pub time_ms: u64,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MusicState {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub is_playing: bool,
    pub progress_seconds: u64,
    pub duration_seconds: u64,
    pub current_lyric: String,
    pub lyrics: Vec<LyricLine>,
}

impl Default for MusicState {
    fn default() -> Self {
        Self {
            title: "No Media Playing".to_string(),
            artist: "Spotify / Apple Music".to_string(),
            album: "macOS Media Bridge".to_string(),
            is_playing: false,
            progress_seconds: 0,
            duration_seconds: 0,
            current_lyric: "Play media in Spotify or Apple Music to stream lyrics".to_string(),
            lyrics: vec![
                LyricLine {
                    id: 1,
                    time_ms: 0,
                    text: "Play a song in Spotify or Apple Music".to_string(),
                },
            ],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatteryState {
    pub percentage: u8,
    pub is_charging: bool,
    pub time_remaining_minutes: Option<u32>,
    pub health: String,
}

impl Default for BatteryState {
    fn default() -> Self {
        Self {
            percentage: 100,
            is_charging: false,
            time_remaining_minutes: None,
            health: "Normal".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IslandNotification {
    pub id: String,
    pub title: String,
    pub message: String,
    pub icon: Option<String>,
    pub category: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ThemePreference {
    #[default]
    Auto,
    Dark,
    Light,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ResolvedTheme {
    #[default]
    Dark,
    Light,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeState {
    /// User preference: "auto" (invert against active app/screen), "dark", or "light"
    pub preference: ThemePreference,
    /// Resulting UI theme applied to Boppi ("dark" = black UI, "light" = white UI)
    pub resolved_theme: ResolvedTheme,
    /// Detected background luminance beneath Boppi ("dark" or "light")
    pub background_luminance: String,
    /// Numeric relative luminance (0.0 = pure black, 1.0 = pure white)
    pub luminance_score: f32,
    /// Currently detected frontmost macOS application name
    pub active_app: String,
}

impl Default for ThemeState {
    fn default() -> Self {
        Self {
            preference: ThemePreference::Auto,
            resolved_theme: ResolvedTheme::Light, // Default to White UI when over dark apps
            background_luminance: "dark".to_string(),
            luminance_score: 0.12,
            active_app: "Desktop".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub notch_model: String,
    pub auto_hide_fullscreen: bool,
    pub show_corner_lyrics: bool,
    pub telemetry_rate_ms: u64,
    pub theme_preference: ThemePreference,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            notch_model: "mbp14".to_string(),
            auto_hide_fullscreen: true,
            show_corner_lyrics: true,
            telemetry_rate_ms: 1000,
            theme_preference: ThemePreference::Auto,
        }
    }
}

#[derive(Clone)]
pub struct AppState(pub Arc<AppStateInner>);

pub struct AppStateInner {
    pub mode: Mutex<IslandMode>,
    pub timer: Mutex<TimerState>,
    pub music: Mutex<MusicState>,
    pub battery: Mutex<BatteryState>,
    pub notification: Mutex<Option<IslandNotification>>,
    pub settings: Mutex<AppSettings>,
    pub theme: Mutex<ThemeState>,
}

impl Default for AppState {
    fn default() -> Self {
        Self(Arc::new(AppStateInner {
            mode: Mutex::new(IslandMode::Compact),
            timer: Mutex::new(TimerState::default()),
            music: Mutex::new(MusicState::default()),
            battery: Mutex::new(BatteryState::default()),
            notification: Mutex::new(None),
            settings: Mutex::new(AppSettings::default()),
            theme: Mutex::new(ThemeState::default()),
        }))
    }
}
