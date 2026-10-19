import { Clock, Music, Mic2, BatteryCharging, Settings, X } from "lucide-react";
import { FeatureTab } from "../types/island";

export interface IslandHeaderProps {
  /** Active selected feature tab */
  activeTab: FeatureTab;
  /** Tab switch event callback */
  onTabChange: (tab: FeatureTab) => void;
  /** Close / collapse island event callback */
  onClose: () => void;
  /** Whether timer is actively ticking */
  timerRunning?: boolean;
  /** Whether music is playing */
  musicPlaying?: boolean;
  /** Battery is charging */
  batteryCharging?: boolean;
  /** Optional notification active indicator */
  hasNotification?: boolean;
}

/**
 * IslandHeader: Authentic Apple macOS Segmented Picker with active indicator dots
 * and circular traffic close trigger.
 */
export const IslandHeader: React.FC<IslandHeaderProps> = ({
  activeTab,
  onTabChange,
  onClose,
  timerRunning = false,
  musicPlaying = false,
  batteryCharging = false,
  hasNotification = false,
}) => {
  return (
    <header className="island-header-bar" role="banner">
      {/* Native Apple macOS Segmented Control */}
      <nav className="segmented-control" role="tablist" aria-label="Feature navigation">
        <button
          role="tab"
          aria-selected={activeTab === "timer"}
          className={`segmented-item icon-only-tab ${activeTab === "timer" ? "selected" : ""}`}
          onClick={() => onTabChange("timer")}
          title="Timer & Focus Sessions (⌘1)"
          aria-label="Timer"
        >
          <Clock size={13} aria-hidden="true" />
          {timerRunning && <span className="segmented-status-dot dot-timer" aria-hidden="true" />}
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "music"}
          className={`segmented-item icon-only-tab ${activeTab === "music" ? "selected" : ""}`}
          onClick={() => onTabChange("music")}
          title="Music Playback (⌘2)"
          aria-label="Music"
        >
          <Music size={13} aria-hidden="true" />
          {musicPlaying && <span className="segmented-status-dot dot-music" aria-hidden="true" />}
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "lyrics"}
          className={`segmented-item icon-only-tab ${activeTab === "lyrics" ? "selected" : ""}`}
          onClick={() => onTabChange("lyrics")}
          title="Karaoke Synced Lyrics (⌘3)"
          aria-label="Lyrics"
        >
          <Mic2 size={13} aria-hidden="true" />
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "battery"}
          className={`segmented-item icon-only-tab ${activeTab === "battery" ? "selected" : ""}`}
          onClick={() => onTabChange("battery")}
          title="Battery Health & Power (⌘4)"
          aria-label="Battery"
        >
          <BatteryCharging size={13} aria-hidden="true" />
          {batteryCharging && <span className="segmented-status-dot dot-battery" aria-hidden="true" />}
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "settings"}
          className={`segmented-item icon-only-tab ${activeTab === "settings" ? "selected" : ""}`}
          onClick={() => onTabChange("settings")}
          title="Preferences (⌘5)"
          aria-label="Settings"
        >
          <Settings size={13} aria-hidden="true" />
          {hasNotification && <span className="segmented-status-dot dot-notification" aria-hidden="true" />}
        </button>
      </nav>

      {/* Traffic light collapse trigger */}
      <div className="header-actions">
        <button
          type="button"
          className="mac-traffic-close-btn"
          onClick={onClose}
          title="Collapse Island (Esc)"
          aria-label="Collapse Island"
        >
          <X size={10} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
