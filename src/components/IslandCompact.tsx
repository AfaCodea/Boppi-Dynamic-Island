import React, { useState, useEffect, useRef, useMemo } from "react";
import { Clock, BatteryCharging, Battery, Music, ChevronDown, Bell } from "lucide-react";
import { FeatureTab, IslandState } from "../types/island";
import { BoppiAvatar } from "./BoppiAvatar";
import { playPopSound } from "../utils/audio";

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
 * Automatically expands fluidly when media plays, timer ticks, or notification appears.
 */
export const IslandCompact: React.FC<IslandCompactProps> = ({
  state,
  onSelectFeature,
  onExpand,
}) => {
  const [bopActive, setBopActive] = useState(false);
  const [welcomeBop, setWelcomeBop] = useState(false);
  const prevTrackRef = useRef(state.music.title);
  const prevLockedRef = useRef(state.isLocked);

  // Smart Wake: Welcome bop and cheerful avatar chime upon unlocking macOS
  useEffect(() => {
    if (prevLockedRef.current === true && !state.isLocked) {
      setWelcomeBop(true);
      playPopSound();
      const t = setTimeout(() => setWelcomeBop(false), 650);
      prevLockedRef.current = state.isLocked;
      return () => clearTimeout(t);
    }
    prevLockedRef.current = state.isLocked;
  }, [state.isLocked]);

  // Trigger Apple-style fluid bounce overshoot when a new song starts or changes
  useEffect(() => {
    if (state.music.isPlaying && state.music.title && state.music.title !== prevTrackRef.current) {
      setBopActive(true);
      const timer = setTimeout(() => setBopActive(false), 550);
      prevTrackRef.current = state.music.title;
      return () => clearTimeout(timer);
    }
    prevTrackRef.current = state.music.title;
  }, [state.music.title, state.music.isPlaying]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleFeatureClick = (tab: FeatureTab, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectFeature?.(tab);
  };

  const isPlaying = state.music.isPlaying;
  const isTimerRunning = state.timer.running;
  const hasValidTrack = Boolean(
    isPlaying &&
      state.music.title &&
      state.music.title !== "No Media Playing" &&
      state.music.title !== "Connecting to Media..."
  );

  // Dynamic Musical Tempo & Rhythm signature tailored to current track
  const tempo = useMemo(() => {
    const title = state.music.title || "";
    const artist = state.music.artist || "";
    const combined = `${title.toLowerCase()} ${artist.toLowerCase()}`;
    const isApple = combined.includes("apple") || artist.includes("Apple Music");

    // Natural, relaxed Apple-style wave duration (1.15s - 1.65s)
    let durationSec = 1.35;
    let bpm = 118;
    if (/lo-?fi|chill|acoustic|ballad|sleep|slow|piano|ambient|sad|meditation|calm/i.test(combined)) {
      durationSec = 1.65;
      bpm = 82;
    } else if (/fast|speed|remix|club|dance|edm|rock|drum|bass|techno|phonk|drill/i.test(combined)) {
      durationSec = 1.15;
      bpm = 138;
    } else if (/hip\s?hop|rap|trap|r&b|groove/i.test(combined)) {
      durationSec = 1.38;
      bpm = 112;
    } else {
      let hash = 0;
      for (let i = 0; i < combined.length; i++) {
        hash = (hash * 31 + combined.charCodeAt(i)) & 0xffffffff;
      }
      bpm = 108 + Math.abs(hash % 24);
      durationSec = Number((1.55 - ((bpm - 108) / 24) * 0.35).toFixed(2));
    }

    return { bpm, durationSec, isApple };
  }, [state.music.title, state.music.artist]);

  return (
    <div
      className={`compact-layout ${bopActive ? "island-fluid-bounce" : ""} ${
        welcomeBop ? "island-welcome-bounce" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onExpand?.();
      }}
      title="Boppi • A little bop above your apps (Click or press ⌥␣ to expand)"
    >
      {state.notification ? (
        <div
          className="compact-notification-capsule"
          onClick={(e) => {
            e.stopPropagation();
            onExpand?.();
          }}
        >
          <div className="compact-notif-leading">
            <BoppiAvatar
              size={18}
              mood={state.notification.category === "timer" ? "happy" : "groove"}
              interactive={false}
            />
          </div>
          <div className="compact-notif-body">
            <span className="compact-notif-title">{state.notification.title}</span>
            <span className="compact-notif-sep">•</span>
            <span className="compact-notif-msg">{state.notification.message}</span>
          </div>
          <div className="compact-notif-badge">
            {state.notification.category === "timer" && <Clock size={11} className="notif-badge-icon timer" />}
            {state.notification.category === "battery" && <Battery size={11} className="notif-badge-icon battery" />}
            {state.notification.category === "music" && <Music size={11} className="notif-badge-icon music" />}
            {(!state.notification.category || state.notification.category === "system") && (
              <Bell size={11} className="notif-badge-icon default" />
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Left Wing: Active Timer, Active Playing Media, or Minimal Idle Badge */}
          <div className="compact-left">
            {isTimerRunning ? (
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
            ) : hasValidTrack ? (
              <button
                type="button"
                className="compact-badge-btn music-badge-subtle is-active"
                onClick={(e) => handleFeatureClick("music", e)}
                title={`Now Playing: ${state.music.title} • ${state.music.artist}`}
              >
                <div className="compact-icon-capsule music-capsule is-playing">
                  <Music size={10} color="currentColor" />
                </div>
                <span className="compact-music-title">{state.music.title}</span>
              </button>
            ) : (
              <button
                type="button"
                className="compact-badge-btn idle-badge-btn"
                onClick={onExpand}
                title="Boppi Mascot • Click to expand"
              >
                <div className="compact-icon-capsule idle-capsule">
                  <BoppiAvatar size={13} mood="idle" interactive={false} />
                </div>
                <span className="compact-idle-label">Boppi</span>
              </button>
            )}
          </div>

          {/* Center: MacBook M-Series FaceTime HD Camera Housing (on Notch Macs) or Mascot (on external screens) */}
          {state.hasHardwareNotch ? (
            <div className="notch-camera-island" title="FaceTime HD Camera">
              <div className="camera-housing">
                <div className="camera-lens">
                  <div className="lens-glint" />
                </div>
                {/* Authentic green sensor indicator LED */}
                <div className="camera-led-green" title="Camera Sensor Ready" />
              </div>
            </div>
          ) : (
            <div className="notch-mascot-center" title="Boppi • A little bop above your apps">
              <BoppiAvatar
                size={14}
                mood={welcomeBop ? "happy" : isPlaying ? "groove" : "idle"}
                interactive={false}
              />
            </div>
          )}

          {/* Right Wing: Animated Audio Equalizer & Apple Battery Status */}
          <div className="compact-right">
            {isPlaying && (
              <button
                type="button"
                className="mini-equalizer-btn is-playing"
                onClick={(e) => handleFeatureClick("lyrics", e)}
                title={`Live Synced Lyrics • ${tempo.bpm} BPM • Klik untuk melihat lirik`}
              >
                <div
                  className="mini-equalizer is-active"
                  aria-hidden="true"
                  style={
                    {
                      "--tempo-duration": `${tempo.durationSec}s`,
                      "--eq-bar-color": tempo.isApple ? "#fa2d48" : "#34c759",
                      "--eq-glow": tempo.isApple
                        ? "rgba(250, 45, 72, 0.4)"
                        : "rgba(52, 199, 89, 0.4)",
                    } as React.CSSProperties
                  }
                >
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
        </>
      )}
    </div>
  );
};
