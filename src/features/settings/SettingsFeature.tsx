import React, { useState } from "react";
import { Monitor, Bell, Command, Sparkles } from "lucide-react";
import { BoppiAvatar } from "../../components/BoppiAvatar";

export const SettingsFeature: React.FC = () => {
  const [autoHideFullscreen, setAutoHideFullscreen] = useState(true);
  const [cornerLyricsEnabled, setCornerLyricsEnabled] = useState(true);

  return (
    <div className="feature-pane settings-view-apple">
      {/* Apple-style Interactive Mascot Profile Card */}
      <div className="boppi-profile-card">
        <div className="boppi-profile-avatar-slot">
          <BoppiAvatar
            size={32}
            mood="idle"
            interactive={true}
            bubblePlacement="bottom"
            showBubbleOnPoke={true}
          />
        </div>
        <div className="boppi-profile-info">
          <div className="boppi-profile-name">
            <span className="boppi-title-main">Boppi</span>
            <span className="boppi-badge-pill">v0.1.0</span>
            <span className="boppi-interactive-hint" title="Klik Boppi untuk menyapa!">
              <Sparkles size={9} />
              <span>Tap me</span>
            </span>
          </div>
          <span className="boppi-profile-sub">A little bop above your apps</span>
        </div>
      </div>

      <div className="mac-settings-group">
        <div className="mac-settings-row">
          <div className="mac-settings-label">
            <Monitor size={12} className="mac-settings-icon icon-display" />
            <div className="mac-settings-text">
              <span className="mac-settings-title">Auto-hide in Fullscreen</span>
              <span className="mac-settings-sub">Collapse when apps go full display</span>
            </div>
          </div>
          <label className="mac-toggle-switch">
            <input
              type="checkbox"
              checked={autoHideFullscreen}
              onChange={(e) => setAutoHideFullscreen(e.target.checked)}
            />
            <span className="mac-toggle-slider" />
          </label>
        </div>

        <div className="mac-settings-divider" />

        <div className="mac-settings-row">
          <div className="mac-settings-label">
            <Bell size={12} className="mac-settings-icon icon-lyrics" />
            <div className="mac-settings-text">
              <span className="mac-settings-title">Floating Desktop Lyrics</span>
              <span className="mac-settings-sub">Draggable MP3 scrolling text HUD</span>
            </div>
          </div>
          <label className="mac-toggle-switch">
            <input
              type="checkbox"
              checked={cornerLyricsEnabled}
              onChange={(e) => setCornerLyricsEnabled(e.target.checked)}
            />
            <span className="mac-toggle-slider" />
          </label>
        </div>
      </div>

      <div className="mac-settings-footer-row">
        <div className="mac-shortcut-hint">
          <Command size={10} />
          <span>Toggle Boppi</span>
          <kbd className="mac-kbd">⌥ ␣</kbd>
        </div>
        <div className="mac-system-version">
          <span>macOS Sonoma Ready</span>
        </div>
      </div>
    </div>
  );
};
