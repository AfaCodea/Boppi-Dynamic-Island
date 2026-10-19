use crate::state::{BatteryState, IslandMode, MusicState, TimerState};
use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tracing::error;

#[derive(Serialize, Clone)]
pub struct IslandModePayload {
    pub mode: IslandMode,
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
