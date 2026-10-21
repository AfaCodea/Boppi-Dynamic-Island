import React, { useState, useEffect, useRef } from "react";
import { FeatureTab, IslandState, ThemePreference } from "../types/island";
import { IslandCompact } from "./IslandCompact";
import { IslandExpanded } from "./IslandExpanded";

export interface IslandShellProps {
  /** Root application state */
  state: IslandState;
  /** Expand island callback */
  onExpand: (tab?: FeatureTab) => void;
  /** Collapse island callback */
  onCollapse: () => void;
  /** Tab switch callback */
  onTabChange: (tab: FeatureTab) => void;
  /** Timer action callbacks */
  onStartTimer: (seconds?: number, label?: string) => void;
  onPauseTimer: () => void;
  onStopTimer: () => void;
  /** Music toggle callback */
  onToggleMusic: () => void;
  /** Real macOS media control callbacks */
  onNextMusic?: () => void;
  onPrevMusic?: () => void;
  onSeekMusic?: (seconds: number) => void;
  /** Adaptive theme preference callbacks */
  onChangeThemePreference?: (pref: ThemePreference) => void;
  onCycleTheme?: () => void;
  /** Notification dismiss callback */
  onDismissNotification?: () => void;
  /** Test notification callback */
  onSendTestNotification?: () => void;
}

/**
 * IslandShell: Root container managing notch ear cutouts, keyboard triggers,
 * and seamless morphing between compact notch and expanded control surface.
 */
export const IslandShell: React.FC<IslandShellProps> = ({
  state,
  onExpand,
  onCollapse,
  onTabChange,
  onStartTimer,
  onPauseTimer,
  onStopTimer,
  onToggleMusic,
  onNextMusic,
  onPrevMusic,
  onSeekMusic,
  onChangeThemePreference,
  onCycleTheme,
  onDismissNotification,
  onSendTestNotification,
}) => {
  const isExpanded = state.mode === "expanded";
  const resolvedTheme = state.theme?.resolvedTheme ?? "light";

  // Morph lifecycle: coordinate fluid Apple-style crossfade without instant unmounting
  const [morphStage, setMorphStage] = useState<"compact" | "expanding" | "expanded" | "collapsing">(
    isExpanded ? "expanded" : "compact"
  );
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isExpanded) {
      setMorphStage("expanding");
      const t = setTimeout(() => {
        setMorphStage("expanded");
      }, 300);
      return () => clearTimeout(t);
    } else {
      setMorphStage("collapsing");
      const t = setTimeout(() => {
        setMorphStage("compact");
      }, 280);
      return () => clearTimeout(t);
    }
  }, [isExpanded]);

  const [ejectLyrics, setEjectLyrics] = useState(false);
  const [swallowLyrics, setSwallowLyrics] = useState(false);
  const prevPlayingRef = useRef<boolean | null>(null);

  // Synchronized Dynamic Island eject & swallow squashes when music starts/pauses
  useEffect(() => {
    if (prevPlayingRef.current === null) {
      prevPlayingRef.current = state.music.isPlaying;
      return;
    }

    if (state.music.isPlaying !== prevPlayingRef.current) {
      prevPlayingRef.current = state.music.isPlaying;
      if (state.music.isPlaying) {
        setEjectLyrics(true);
        const t = setTimeout(() => setEjectLyrics(false), 440);
        return () => clearTimeout(t);
      } else {
        // Wait 260ms until text collapses into mascot before island catches the leaping icon
        const delay = setTimeout(() => {
          setSwallowLyrics(true);
          const t2 = setTimeout(() => setSwallowLyrics(false), 400);
          return () => clearTimeout(t2);
        }, 260);
        return () => clearTimeout(delay);
      }
    }
  }, [state.music.isPlaying]);

  const shouldRenderCompact = !isExpanded || morphStage === "collapsing" || morphStage === "expanding";
  const shouldRenderExpanded = isExpanded || morphStage === "collapsing" || morphStage === "expanding";

  const isMusicActive = Boolean(state.music.isPlaying);
  const isTimerActive = Boolean(state.timer.running);
  const hasNotification = Boolean(state.notification);
  const isIdle = !isMusicActive && !isTimerActive && !hasNotification;

  const shellClasses = [
    "island-shell",
    isExpanded ? "expanded" : "compact",
    `morph-${morphStage}`,
    isMusicActive ? "has-music" : "",
    isTimerActive ? "has-timer" : "",
    hasNotification ? "has-notification" : "",
    isIdle ? "is-idle" : "has-activity",
    ejectLyrics ? "ejecting-lyrics" : "",
    swallowLyrics ? "swallowing-lyrics" : "",
    state.isLocked ? "is-locked" : "",
    `theme-${resolvedTheme}`,
  ]
    .filter(Boolean)
    .join(" ");

  const handleShellClick = () => {
    // Only expand if currently fully compact and not transitioning
    if (!isExpanded && morphStage === "compact") {
      onExpand();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === "Enter" || e.key === " ") && !isExpanded) {
      e.preventDefault();
      onExpand();
    } else if (e.key === "Escape" && isExpanded) {
      e.preventDefault();
      onCollapse();
    }
  };

  return (
    <div className="island-container" data-theme={resolvedTheme}>
      <div
        className={shellClasses}
        onClick={handleShellClick}
        onKeyDown={handleKeyDown}
        role={isExpanded ? "region" : "button"}
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Boppi Controls" : "Boppi Capsule"}
      >
        <div className="island-inner-clip">
          {shouldRenderCompact && (
            <div
              className={`island-view-wrapper compact-view-wrapper ${
                morphStage === "expanding" ? "anim-exit" : morphStage === "collapsing" ? "anim-enter" : ""
              }`}
              aria-hidden={isExpanded}
            >
              <IslandCompact
                state={state}
                onSelectFeature={(tab) => onExpand(tab)}
                onExpand={() => onExpand()}
              />
            </div>
          )}

          {shouldRenderExpanded && (
            <div
              className={`island-view-wrapper expanded-view-wrapper ${
                morphStage === "expanding" ? "anim-enter" : morphStage === "collapsing" ? "anim-exit" : ""
              }`}
              aria-hidden={!isExpanded}
            >
              <IslandExpanded
                state={state}
                onTabChange={onTabChange}
                onClose={onCollapse}
                onStartTimer={onStartTimer}
                onPauseTimer={onPauseTimer}
                onStopTimer={onStopTimer}
                onToggleMusic={onToggleMusic}
                onNextMusic={onNextMusic}
                onPrevMusic={onPrevMusic}
                onSeekMusic={onSeekMusic}
                onChangeThemePreference={onChangeThemePreference}
                onCycleTheme={onCycleTheme}
                onDismissNotification={onDismissNotification}
                onSendTestNotification={onSendTestNotification}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
