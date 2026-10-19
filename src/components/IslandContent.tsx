import React from "react";
import { FeatureTab, IslandState } from "../types/island";
import { IslandTimer } from "./IslandTimer";
import { IslandMusicPlayer } from "./IslandMusicPlayer";
import { LyricsFeature } from "../features/lyrics/LyricsFeature";
import { IslandBatteryIndicator } from "./IslandBatteryIndicator";
import { IslandSettingsPanel } from "./IslandSettingsPanel";

export interface IslandContentProps {
  /** Selected active tab */
  tab: FeatureTab;
  /** Current state */
  state: IslandState;
  /** Timer handlers */
  onStartTimer: (seconds?: number, label?: string) => void;
  onPauseTimer: () => void;
  onStopTimer: () => void;
  /** Music toggle handler */
  onToggleMusic: () => void;
  /** Next/prev/seek handlers for real macOS media apps */
  onNextMusic?: () => void;
  onPrevMusic?: () => void;
  onSeekMusic?: (seconds: number) => void;
}

/**
 * IslandContent: Router displaying active feature pane inside expanded island.
 */
export const IslandContent: React.FC<IslandContentProps> = ({
  tab,
  state,
  onStartTimer,
  onPauseTimer,
  onStopTimer,
  onToggleMusic,
  onNextMusic,
  onPrevMusic,
  onSeekMusic,
}) => {
  switch (tab) {
    case "timer":
      return (
        <IslandTimer
          timer={state.timer}
          onStart={onStartTimer}
          onPause={onPauseTimer}
          onStop={onStopTimer}
        />
      );
    case "music":
      return (
        <IslandMusicPlayer
          music={state.music}
          onTogglePlay={onToggleMusic}
          onNext={onNextMusic}
          onPrev={onPrevMusic}
          onSeek={onSeekMusic}
        />
      );
    case "lyrics":
      return <LyricsFeature music={state.music} />;
    case "battery":
      return <IslandBatteryIndicator battery={state.battery} />;
    case "settings":
      return <IslandSettingsPanel />;
    default:
      return null;
  }
};
