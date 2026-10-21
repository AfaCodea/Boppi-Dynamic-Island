import React, { useState, useEffect, useRef, useMemo } from "react";
import { Clock, Music, ChevronDown, Bell } from "lucide-react";
import { FeatureTab, IslandState } from "../types/island";
import { BoppiAvatar } from "./BoppiAvatar";
import { BatteryGlyph } from "./BatteryGlyph";
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
  const isTimerRunning = Boolean(state.timer.running);
  const hasValidTrack = Boolean(
    isPlaying &&
      state.music.title &&
      state.music.title !== "No Media Playing" &&
      state.music.title !== "Connecting to Media..."
  );

  // Left-wing activities: Focus Timer / Pomodoro and Playing Music
  const activeFeatures = useMemo(() => {
    const list: FeatureTab[] = [];
    if (isTimerRunning) list.push("timer");
    if (hasValidTrack) list.push("music");
    return list;
  }, [isTimerRunning, hasValidTrack]);

  const [currentFeature, setCurrentFeature] = useState<FeatureTab | null>(() => activeFeatures[0] ?? null);
  const [exitingFeature, setExitingFeature] = useState<FeatureTab | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRollerHovered, setIsRollerHovered] = useState(false);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync currentFeature when active activities change
  useEffect(() => {
    if (activeFeatures.length === 0) {
      setCurrentFeature(null);
      setExitingFeature(null);
      setIsTransitioning(false);
    } else if (!currentFeature || !activeFeatures.includes(currentFeature)) {
      setCurrentFeature(activeFeatures[0]);
      setExitingFeature(null);
      setIsTransitioning(false);
    }
  }, [activeFeatures, currentFeature]);

  // Rolling carousel every 5 seconds when multiple features are active simultaneously
  useEffect(() => {
    if (activeFeatures.length <= 1 || isRollerHovered) return;

    const interval = setInterval(() => {
      setCurrentFeature((curr) => {
        const validCurr = curr && activeFeatures.includes(curr) ? curr : activeFeatures[0];
        const currentIndex = activeFeatures.indexOf(validCurr);
        const nextIndex = (currentIndex + 1) % activeFeatures.length;
        const nextFeature = activeFeatures[nextIndex];

        setExitingFeature(validCurr);
        setIsTransitioning(true);

        if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
        rollTimerRef.current = setTimeout(() => {
          setExitingFeature(null);
          setIsTransitioning(false);
        }, 420);

        return nextFeature;
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, [activeFeatures, isRollerHovered]);

  const renderFeatureBadge = (feature: FeatureTab) => {
    if (feature === "timer") {
      return (
        <button
          type="button"
          className="compact-badge-btn timer-badge-active"
          onClick={(e) => handleFeatureClick("timer", e)}
          title={`Focus Timer • ${formatTime(state.timer.remainingSeconds)} • Click to manage`}
        >
          <div className="compact-icon-capsule timer-capsule">
            <Clock size={10} className="timer-spin-subtle" />
          </div>
          <span className="compact-tabular-time">{formatTime(state.timer.remainingSeconds)}</span>
        </button>
      );
    }
    if (feature === "music") {
      return (
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
      );
    }
    return null;
  };

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

    // Authentic Apple iOS Dynamic Island: Pure crisp solid matte color, zero shadow, zero dark gradient
    const barColor = isApple ? "#fa2d48" : "#30d158";

    return { bpm, durationSec, isApple, barColor };
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
            {state.notification.category === "battery" && (
              <BatteryGlyph
                percentage={state.battery.percentage}
                isCharging={state.battery.isCharging}
                size={11}
                className="notif-badge-icon battery"
              />
            )}
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
            {activeFeatures.length > 0 ? (
              <div
                className={`compact-roller-viewport ${activeFeatures.length > 1 ? "is-multi-rolling" : ""}`}
                onMouseEnter={() => setIsRollerHovered(true)}
                onMouseLeave={() => setIsRollerHovered(false)}
              >
                {exitingFeature && (
                  <div key={`exit-${exitingFeature}`} className="compact-roller-item roll-exit-up">
                    {renderFeatureBadge(exitingFeature)}
                  </div>
                )}
                {currentFeature && (
                  <div
                    key={`curr-${currentFeature}`}
                    className={`compact-roller-item ${isTransitioning ? "roll-enter-up" : ""}`}
                  >
                    {renderFeatureBadge(currentFeature)}
                  </div>
                )}
              </div>
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
                      "--eq-bar-color": tempo.barColor,
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
              className={`compact-badge-btn battery-badge-btn ${
                state.battery.isCharging
                  ? "is-charging"
                  : state.battery.percentage <= 20
                  ? "is-low"
                  : ""
              }`}
              onClick={(e) => handleFeatureClick("battery", e)}
              title={`Battery: ${state.battery.percentage}% ${
                state.battery.isCharging ? "(Sedang Mengisi Daya ⚡)" : "(Menggunakan Baterai)"
              }`}
            >
              <BatteryGlyph
                percentage={state.battery.percentage}
                isCharging={state.battery.isCharging}
                size={13}
              />
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
