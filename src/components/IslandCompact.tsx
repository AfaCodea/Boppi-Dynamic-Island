import React from "react";
import { Clock, BatteryCharging, Battery, Music, ChevronDown } from "lucide-react";
import { FeatureTab, IslandState } from "../types/island";

export interface IslandCompactProps {
  /** Complete Island state */
  state: IslandState;
  /** Callback when user clicks a specific wing/feature */
  onSelectFeature?: (tab: FeatureTab) => void;
  /** Optional click to expand callback */
  onExpand?: () => void;
}

/**
 * IslandCompact: Minimalist M-Series Notch Capsule.
 * Displays left wing (Timer/Music), center FaceTime camera, and right wing (Visualizer/Battery).
 */
export const IslandCompact: React.FC<IslandCompactProps> = ({
  state,
  onSelectFeature,
  onExpand,
}) => {

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleFeatureClick = (tab: FeatureTab, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectFeature?.(tab);
  };

  return (
    <div
      className="compact-layout"
      onClick={onExpand}
      title="Boppi • A little bop above your apps (Click or press ⌥␣ to expand)"
    >
      {/* Left Wing: Active Timer or Now Playing Media */}
      <div className="compact-left">
        {state.timer.running ? (
          <button
            type="button"
            className="compact-badge-btn timer-badge-active"
            onClick={(e) => handleFeatureClick("timer", e)}
            title="Focus Timer • Click to manage"
          >
            <div className="compact-icon-capsule timer-capsule">
              <Clock size={10} className="timer-spin-subtle" />
            </div>
            <span className="compact-tabular-time">{formatTime(state.timer.remainingSeconds)}</span>
          </button>
        ) : (
          <button
            type="button"
            className="compact-badge-btn music-badge-subtle"
            onClick={(e) => handleFeatureClick("music", e)}
            title={`Now Playing: ${state.music.title} • ${state.music.artist}`}
          >
            <div className={`compact-icon-capsule music-capsule ${state.music.isPlaying ? "is-playing" : ""}`}>
              <Music size={10} color="#ffffff" />
            </div>
            <span className="compact-music-title">{state.music.title}</span>
          </button>
        )}
      </div>

      {/* Center: MacBook M-Series FaceTime HD Camera Housing with Indicator LED */}
      <div className="notch-camera-island" title="FaceTime HD Camera">
        <div className="camera-housing">
          <div className="camera-lens">
            <div className="lens-glint" />
          </div>
          {/* Authentic green sensor indicator LED */}
          <div className="camera-led-green" title="Camera Sensor Ready" />
        </div>
      </div>

      {/* Right Wing: Animated Audio Equalizer & Apple Battery Status */}
      <div className="compact-right">
        {state.music.isPlaying && (
          <button
            type="button"
            className="mini-equalizer-btn"
            onClick={(e) => handleFeatureClick("lyrics", e)}
            title="Live Synced Lyrics • Click to view"
          >
            <div className="mini-equalizer" aria-hidden="true">
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
            </div>
          </button>
        )}

        {/* Battery Telemetry Badge */}
        <button
          type="button"
          className="compact-badge-btn battery-badge-btn"
          onClick={(e) => handleFeatureClick("battery", e)}
          title={`Battery: ${state.battery.percentage}% ${state.battery.isCharging ? "(Charging)" : ""}`}
        >
          {state.battery.isCharging ? (
            <BatteryCharging size={13} className="battery-charging-glyph" />
          ) : (
            <Battery size={13} className="battery-glyph" />
          )}
          <span className="compact-battery-pct">{state.battery.percentage}%</span>
        </button>
      </div>

      {/* Subtle downward expand indicator cue */}
      <div className="compact-expand-cue" aria-hidden="true">
        <ChevronDown size={9} className="expand-chevron" />
      </div>
    </div>
  );
};
