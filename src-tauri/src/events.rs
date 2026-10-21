use crate::state::{BatteryState, IslandMode, MusicState, ThemeState, TimerState};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tracing::error;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NotificationPayload {
    pub id: String,
    pub title: String,
    pub message: String,
    pub category: Option<String>,
    pub time_label: Option<String>,
    pub action_label: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct IslandModePayload {
    pub mode: IslandMode,
}

pub fn emit_notification(app: &AppHandle, payload: &NotificationPayload) {
    if let Err(err) = app.emit("island-notification", payload) {
        error!("Failed to emit island-notification event: {:?}", err);
    }
}

pub fn emit_timer_tick(app: &AppHandle, payload: &TimerState) {
    if let Err(err) = app.emit("timer-tick", payload) {
        error!("Failed to emit timer-tick event: {:?}", err);
    }
}

pub fn emit_music_changed(app: &AppHandle, payload: &MusicState) {
    if let Err(err) = app.emit("music-changed", payload) {
        error!("Failed to emit music-changed event: {:?}", err);
    }
}

pub fn emit_battery_updated(app: &AppHandle, payload: &BatteryState) {
    if let Err(err) = app.emit("battery-updated", payload) {
        error!("Failed to emit battery-updated event: {:?}", err);
    }
}

pub fn emit_island_state_changed(app: &AppHandle, mode: IslandMode) {
    if let Err(err) = app.emit("island-state-changed", IslandModePayload { mode }) {
        error!("Failed to emit island-state-changed event: {:?}", err);
    }
}

pub fn emit_theme_changed(app: &AppHandle, payload: &ThemeState) {
    if let Err(err) = app.emit("theme-changed", payload) {
        error!("Failed to emit theme-changed event: {:?}", err);
    }
}

pub fn emit_system_sleep_state(app: &AppHandle, is_locked: bool) {
    if let Err(err) = app.emit("system-lock-state", is_locked) {
        error!("Failed to emit system-lock-state event: {:?}", err);
    }
}
