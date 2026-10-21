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
                    let old_charging = last_charging;
                    let old_pct = last_pct;
                    last_pct = state.percentage;
                    last_charging = state.is_charging;
                    emit_battery_updated(&app, &state);

                    // Connected notifications for battery changes
                    if state.is_charging && !old_charging && old_pct > 0 {
                        crate::events::emit_notification(
                            &app,
                            &crate::events::NotificationPayload {
                                id: format!("batt-charge-{}", state.percentage),
                                title: "Charger Terhubung ⚡".to_string(),
                                message: format!("Baterai {}% • Pengisian daya aktif", state.percentage),
                                category: Some("battery".to_string()),
                                time_label: Some("Now".to_string()),
                                action_label: None,
                            },
                        );
                    } else if !state.is_charging && old_charging && old_pct > 0 {
                        crate::events::emit_notification(
                            &app,
                            &crate::events::NotificationPayload {
                                id: format!("batt-unplug-{}", state.percentage),
                                title: "Mode Baterai 🔋".to_string(),
                                message: format!("Sisa baterai {}%", state.percentage),
                                category: Some("battery".to_string()),
                                time_label: Some("Now".to_string()),
                                action_label: None,
                            },
                        );
                    } else if state.percentage <= 20 && !state.is_charging && old_pct > 20 {
                        crate::events::emit_notification(
                            &app,
                            &crate::events::NotificationPayload {
                                id: format!("batt-low-{}", state.percentage),
                                title: "Baterai Lemah ⚠️".to_string(),
                                message: format!("Sisa baterai {}%. Segera sambungkan pengisi daya.", state.percentage),
                                category: Some("battery".to_string()),
                                time_label: Some("Now".to_string()),
                                action_label: None,
                            },
                        );
                    }
                }

                sleep(Duration::from_secs(2)).await;
            }
        });
    }

    #[cfg(target_os = "macos")]
    fn parse_pmset_output(stdout: &str) -> BatteryState {
        let mut state = BatteryState::default();
        let on_ac = stdout.contains("AC Power");

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

                // Accurate macOS battery charging detection:
                // Must be drawing from AC Power, or line explicitly has charging status (NOT discharging!)
                let is_discharging = line.contains("discharging") || stdout.contains("Battery Power");
                let is_actively_charging = line.contains("; charging")
                    || line.contains("finishing charge")
                    || line.contains("; charged");

                state.is_charging = (on_ac || is_actively_charging) && !is_discharging;

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
