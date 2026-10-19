use crate::events::emit_battery_updated;
use crate::state::BatteryState;
use std::process::Command;
use std::time::Duration;
use tauri::AppHandle;
use tokio::time::sleep;

pub struct BatteryService;

impl BatteryService {
    pub fn read_status() -> BatteryState {
        #[cfg(target_os = "macos")]
        {
            if let Ok(output) = Command::new("pmset").arg("-g").arg("batt").output() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                return Self::parse_pmset_output(&stdout);
            }
        }

        BatteryState::default()
    }

    /// Background loop polling hardware battery condition every 5 seconds
    pub fn start_battery_loop(app: AppHandle) {
        tauri::async_runtime::spawn(async move {
            let mut last_pct = 0u8;
            let mut last_charging = false;

            loop {
                let state = tokio::task::spawn_blocking(Self::read_status)
                    .await
                    .unwrap_or_default();

                if state.percentage != last_pct || state.is_charging != last_charging {
                    last_pct = state.percentage;
                    last_charging = state.is_charging;
                    emit_battery_updated(&app, &state);
                }

                sleep(Duration::from_secs(5)).await;
            }
        });
    }

    #[cfg(target_os = "macos")]
    fn parse_pmset_output(stdout: &str) -> BatteryState {
        let mut state = BatteryState::default();

        for line in stdout.lines() {
            if line.contains('%') {
                if let Some(pct_pos) = line.find('%') {
                    let start = line[..pct_pos]
                        .rfind(|c: char| !c.is_numeric())
                        .map_or(0, |idx| idx + 1);
                    if let Ok(pct) = line[start..pct_pos].trim().parse::<u8>() {
                        state.percentage = pct;
                    }
                }

                state.is_charging = stdout.contains("AC Power")
                    || line.contains("charging")
                    || line.contains("finishing charge")
                    || line.contains("charged");

                if line.contains("remaining") {
                    let parts: Vec<&str> = line.split(';').collect();
                    if parts.len() >= 3 {
                        let time_str = parts[2].split_whitespace().next().unwrap_or("");
                        let hm: Vec<&str> = time_str.split(':').collect();
                        if hm.len() == 2 {
                            if let (Ok(h), Ok(m)) = (hm[0].parse::<u32>(), hm[1].parse::<u32>()) {
                                state.time_remaining_minutes = Some(h * 60 + m);
                            }
                        }
                    }
                }
            }
        }

        state
    }
}
