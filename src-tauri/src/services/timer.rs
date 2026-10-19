use crate::events::emit_timer_tick;
use crate::state::AppState;
use std::sync::MutexGuard;
use std::time::{Duration, Instant};
use tauri::AppHandle;
use tokio::time::sleep;
use tracing::info;

pub struct TimerService;

impl TimerService {
    fn lock_timer(state: &AppState) -> MutexGuard<'_, crate::state::TimerState> {
        state
            .0
            .timer
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    pub fn start(app: AppHandle, state: AppState, duration_seconds: u64, label: String) {
        let (my_generation, clone_state) = {
            let mut timer = Self::lock_timer(&state);
            let target_instant = Instant::now() + Duration::from_secs(duration_seconds);
            timer.running = true;
            timer.paused = false;
            timer.total_seconds = duration_seconds;
            timer.remaining_seconds = duration_seconds;
            timer.label = label;
            timer.end_instant = Some(target_instant);
            timer.generation = timer.generation.wrapping_add(1);
            (timer.generation, timer.clone())
        };

        emit_timer_tick(&app, &clone_state);

        // Spawn background ticking worker tied to this generation
        tauri::async_runtime::spawn(async move {
            info!(
                "Timer started for {}s (gen: {})",
                duration_seconds, my_generation
            );
            loop {
                sleep(Duration::from_millis(500)).await;

                let mut timer = Self::lock_timer(&state);
                // Exit if timer was stopped, paused, or superseded by a newer timer
                if !timer.running || timer.paused || timer.generation != my_generation {
                    break;
                }

                if let Some(target) = timer.end_instant {
                    let now = Instant::now();
                    if now >= target {
                        timer.running = false;
                        timer.remaining_seconds = 0;
                        timer.end_instant = None;
                        let final_state = timer.clone();
                        drop(timer);
                        emit_timer_tick(&app, &final_state);
                        info!("Timer completed (gen: {})", my_generation);
                        break;
                    } else {
                        let remaining = (target - now).as_secs();
                        if remaining != timer.remaining_seconds {
                            timer.remaining_seconds = remaining;
                            let tick_state = timer.clone();
                            drop(timer);
                            emit_timer_tick(&app, &tick_state);
                        }
                    }
                } else {
                    break;
                }
            }
        });
    }

    pub fn pause(app: &AppHandle, state: &AppState) {
        let mut timer = Self::lock_timer(state);
        if timer.running && !timer.paused {
            if let Some(target) = timer.end_instant {
                let now = Instant::now();
                if target > now {
                    timer.remaining_seconds = (target - now).as_secs();
                } else {
                    timer.remaining_seconds = 0;
                }
            }
            timer.running = false;
            timer.paused = true;
            timer.end_instant = None;
            let clone_state = timer.clone();
            drop(timer);
            emit_timer_tick(app, &clone_state);
        }
    }

    pub fn stop(app: &AppHandle, state: &AppState) {
        let mut timer = Self::lock_timer(state);
        timer.running = false;
        timer.paused = false;
        timer.remaining_seconds = timer.total_seconds;
        timer.end_instant = None;
        timer.generation = timer.generation.wrapping_add(1);
        let clone_state = timer.clone();
        drop(timer);
        emit_timer_tick(app, &clone_state);
    }
}
