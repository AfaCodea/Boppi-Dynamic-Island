import React from "react";
import { FeatureTab, IslandState } from "../types/island";
import { IslandHeader } from "./IslandHeader";
import { IslandContent } from "./IslandContent";
import { IslandNotification } from "./IslandNotification";
import { IslandQuickActions } from "./IslandQuickActions";

export interface IslandExpandedProps {
  /** Complete application state */
  state: IslandState;
  /** Tab switch event callback */
  onTabChange: (tab: FeatureTab) => void;
  /** Close / collapse island event callback */
  onClose: () => void;
  /** Timer handlers */
  onStartTimer: (seconds?: number, label?: string) => void;
  onPauseTimer: () => void;
  onStopTimer: () => void;
  /** Music toggle handler */
  onToggleMusic: () => void;
  /** Real macOS media control handlers */
  onNextMusic?: () => void;
  onPrevMusic?: () => void;
  onSeekMusic?: (seconds: number) => void;
  /** Optional notification dismiss */
  onDismissNotification?: () => void;
}

/**
 * IslandExpanded: The expanded surface dropping down from the MacBook physical notch.
 * Houses the segmented navigation header, dynamic content pane, and quick actions dock.
 */
export const IslandExpanded: React.FC<IslandExpandedProps> = ({
  state,
  onTabChange,
  onClose,
  onStartTimer,
  onPauseTimer,
  onStopTimer,
  onToggleMusic,
  onNextMusic,
  onPrevMusic,
  onSeekMusic,
  onDismissNotification,
}) => {
  return (
    <div
      className="expanded-layout-wrapper"
      role="dialog"
      aria-modal="true"
      aria-label="Expanded Boppi"
    >
      {/* Top Header: macOS Segmented Control & Traffic Close */}
      <IslandHeader
        activeTab={state.activeFeature}
        onTabChange={onTabChange}
        onClose={onClose}
        timerRunning={state.timer.running}
        musicPlaying={state.music.isPlaying}
        batteryCharging={state.battery.isCharging}
        hasNotification={Boolean(state.notification)}
      />

      {/* Notification Preview Banner (if triggered) */}
      {state.notification && (
        <IslandNotification
          notification={state.notification}
          onDismiss={onDismissNotification || (() => {})}
        />
      )}

      {/* Dynamic Content Main Pane */}
      <main className="expanded-content-area">
        <IslandContent
          tab={state.activeFeature}
          state={state}
          onStartTimer={onStartTimer}
          onPauseTimer={onPauseTimer}
          onStopTimer={onStopTimer}
          onToggleMusic={onToggleMusic}
          onNextMusic={onNextMusic}
          onPrevMusic={onPrevMusic}
          onSeekMusic={onSeekMusic}
        />
      </main>

      {/* One-Tap Quick Actions Dock */}
      <footer className="expanded-footer-dock">
        <IslandQuickActions
          onStartFocus={() => {
            onTabChange("timer");
            onStartTimer(25 * 60, "Pomodoro Focus");
          }}
          onTakeBreak={() => {
            onTabChange("timer");
            onStartTimer(5 * 60, "Short Break");
          }}
          onToggleLyricsHUD={() => {
            onTabChange("lyrics");
          }}
          onMute={onToggleMusic}
        />
      </footer>
    </div>
  );
};
