import React, { useState } from "react";
import { Monitor, Bell, Command, SunMoon } from "lucide-react";
import { BoppiAvatar } from "./BoppiAvatar";
import { AppSettings, ThemePreference, ThemeState } from "../types/island";

export interface IslandSettingsPanelProps {
  /** Optional external settings payload */
  settings?: AppSettings;
  /** Current adaptive theme state */
  theme?: ThemeState;
  /** Theme preference change handler */
  onChangeThemePreference?: (pref: ThemePreference) => void;
  /** Settings change handler */
  onUpdateSettings?: (settings: Partial<AppSettings>) => void;
  /** Test notification callback */
  onSendTestNotification?: () => void;
}

/**
 * IslandSettingsPanel: System settings panel conforming to macOS Sequoia / Sonoma
 * grouped cell layouts with native-feeling toggle switches and adaptive contrast controls.
 */
export const IslandSettingsPanel: React.FC<IslandSettingsPanelProps> = ({
  settings,
  theme,
  onChangeThemePreference,
  onUpdateSettings,
  onSendTestNotification,
}) => {
  const [autoHide, setAutoHide] = useState(settings?.autoHideFullscreen ?? true);
  const [lyricsHUD, setLyricsHUD] = useState(settings?.showCornerLyrics ?? true);
  const currentPref = theme?.preference ?? "auto";
  const activeApp = theme?.activeApp || "Desktop";
  const resolved = theme?.resolvedTheme ?? "light";

  const toggleAutoHide = (val: boolean) => {
    setAutoHide(val);
    onUpdateSettings?.({ autoHideFullscreen: val });
  };

  const toggleLyrics = (val: boolean) => {
    setLyricsHUD(val);
    onUpdateSettings?.({ showCornerLyrics: val });
  };

  return (
    <div className="feature-pane island-settings-pane" role="region" aria-label="Application Settings">
      <div className="mac-settings-group">
        {/* Smart Adaptive Contrast Mode */}
        <div className="mac-settings-row">
          <div className="mac-settings-label">
            <SunMoon size={13} className="mac-settings-icon" style={{ color: "var(--island-accent-amber)" }} aria-hidden="true" />
            <div className="mac-settings-text">
              <span className="mac-settings-title">Adaptive UI Contrast</span>
              <span className="mac-settings-sub">
                {currentPref === "auto"
                  ? `Auto: ${resolved === "light" ? "White UI" : "Black UI"} on ${activeApp} (${theme?.backgroundLuminance === "dark" ? "Dark App" : "Light App"})`
                  : `Manual: Always ${currentPref === "light" ? "White (Light)" : "Black (Dark)"}`}
              </span>
            </div>
          </div>
          <select
            className="mac-select-picker"
            value={currentPref}
            onChange={(e) => {
              const val = e.target.value as ThemePreference;
              onChangeThemePreference?.(val);
            }}
            aria-label="Adaptive UI Contrast Mode"
          >
            <option value="auto">Auto (Smart Invert)</option>
            <option value="light">White (Light Surface)</option>
            <option value="dark">Black (Dark Surface)</option>
          </select>
        </div>

        <div className="mac-settings-divider" />

        {/* Fullscreen Auto-hide */}
        <div className="mac-settings-row">
          <div className="mac-settings-label">
            <Monitor size={13} className="mac-settings-icon icon-display" aria-hidden="true" />
            <div className="mac-settings-text">
              <span className="mac-settings-title">Auto-hide in Fullscreen</span>
              <span className="mac-settings-sub">Collapse when an app occupies entire display</span>
            </div>
          </div>
          <label className="mac-toggle-switch">
            <input
              type="checkbox"
              checked={autoHide}
              onChange={(e) => toggleAutoHide(e.target.checked)}
              aria-label="Toggle auto-hide in fullscreen"
            />
            <span className="mac-toggle-slider" />
          </label>
        </div>

        <div className="mac-settings-divider" />

        {/* Floating Desktop Lyrics HUD */}
        <div className="mac-settings-row">
          <div className="mac-settings-label">
            <Bell size={13} className="mac-settings-icon icon-lyrics" aria-hidden="true" />
            <div className="mac-settings-text">
              <span className="mac-settings-title">Floating Desktop Lyrics HUD</span>
              <span className="mac-settings-sub">Draggable mini marquee capsule</span>
            </div>
          </div>
          <label className="mac-toggle-switch">
            <input
              type="checkbox"
              checked={lyricsHUD}
              onChange={(e) => toggleLyrics(e.target.checked)}
              aria-label="Toggle floating desktop lyrics"
            />
            <span className="mac-toggle-slider" />
          </label>
        </div>

        <div className="mac-settings-divider" />

        {/* Connected Notifications Test */}
        <div className="mac-settings-row">
          <div className="mac-settings-label">
            <Bell size={13} className="mac-settings-icon" style={{ color: "var(--island-accent-cyan)" }} aria-hidden="true" />
            <div className="mac-settings-text">
              <span className="mac-settings-title">Notifikasi Terhubung Boppi</span>
              <span className="mac-settings-sub">Banner interaktif untuk timer, baterai, & musik</span>
            </div>
          </div>
          <button
            type="button"
            className="mac-btn-test-notif"
            onClick={onSendTestNotification}
            title="Kirim notifikasi uji coba"
          >
            Kirim Tes
          </button>
        </div>
      </div>

      {/* Footer shortcut info */}
      <div className="mac-settings-footer-row">
        <div className="mac-shortcut-hint">
          <Command size={11} aria-hidden="true" />
          <span>Toggle Boppi Overlay:</span>
          <kbd className="mac-kbd">⌥ ␣</kbd>
        </div>
        <div className="mac-system-version" title="Boppi: A little bop above your apps">
          <BoppiAvatar size={14} interactive={true} bubblePlacement="top" />
          <span>Boppi • Smart Contrast Ready</span>
        </div>
      </div>
    </div>
  );
};
