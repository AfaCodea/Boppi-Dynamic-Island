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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub notch_model: String,
    pub auto_hide_fullscreen: bool,
    pub show_corner_lyrics: bool,
    pub telemetry_rate_ms: u64,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            notch_model: "mbp14".to_string(),
            auto_hide_fullscreen: true,
            show_corner_lyrics: true,
            telemetry_rate_ms: 1000,
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
        }))
    }
}
