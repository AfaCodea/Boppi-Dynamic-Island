import React, { useState } from "react";
import { Monitor, Bell, Command, Sparkles } from "lucide-react";
import { BoppiAvatar } from "./BoppiAvatar";
import { AppSettings } from "../types/island";

export interface IslandSettingsPanelProps {
  /** Optional external settings payload */
  settings?: AppSettings;
  /** Settings change handler */
  onUpdateSettings?: (settings: Partial<AppSettings>) => void;
}

/**
 * IslandSettingsPanel: System settings panel conforming to macOS Sequoia / Sonoma
 * grouped cell layouts with native-feeling toggle switches.
 */
export const IslandSettingsPanel: React.FC<IslandSettingsPanelProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [autoHide, setAutoHide] = useState(settings?.autoHideFullscreen ?? true);
  const [lyricsHUD, setLyricsHUD] = useState(settings?.showCornerLyrics ?? true);
  const [notchModel, setNotchModel] = useState<"mbp14" | "mbp16" | "fallback">(
    settings?.notchModel ?? "mbp14"
  );

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

        {/* Notch Hardware Profile Selection */}
        <div className="mac-settings-row">
          <div className="mac-settings-label">
            <Sparkles size={13} className="mac-settings-icon" style={{ color: "var(--island-accent-amber)" }} />
            <div className="mac-settings-text">
              <span className="mac-settings-title">Notch Display Geometry</span>
              <span className="mac-settings-sub">Profile: MacBook Pro 14" / 16" (2021)</span>
            </div>
          </div>
          <select
            className="mac-select-picker"
            value={notchModel}
            onChange={(e) => {
              const val = e.target.value as "mbp14" | "mbp16" | "fallback";
              setNotchModel(val);
              onUpdateSettings?.({ notchModel: val });
            }}
            aria-label="Notch display geometry profile"
          >
            <option value="mbp14">14-inch (210×34 pt)</option>
            <option value="mbp16">16-inch (214×36 pt)</option>
            <option value="fallback">Non-Notch Floating</option>
          </select>
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
          <BoppiAvatar size={14} />
          <span>Boppi • A little bop above your apps</span>
        </div>
      </div>
    </div>
  );
};
