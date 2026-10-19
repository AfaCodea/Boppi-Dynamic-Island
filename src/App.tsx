import React, { useEffect, useState, useCallback } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useIslandState } from "./hooks/useIslandState";
import { IslandShell } from "./components/IslandShell";
import { CornerLyrics } from "./components/CornerLyrics";
import { PomodoroHUD } from "./components/PomodoroHUD";
import "./styles/island.css";

export const App: React.FC = () => {
  const [windowLabel, setWindowLabel] = useState<string>("island");

  const {
    state,
    expand,
    collapse,
    setActiveFeature,
    startTimer,
    pauseTimer,
    stopTimer,
    toggleMusicPlayback,
    nextTrack,
    prevTrack,
    seekTrack,
  } = useIslandState();

  useEffect(() => {
    try {
      const appWindow = getCurrentWebviewWindow();
      if (appWindow && appWindow.label) {
        setWindowLabel(appWindow.label);
      }
    } catch {
      // In web preview, default to island
    }
  }, []);

  // Global keyboard shortcuts for macOS utility ergonomics
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Option + Space toggles island expansion
      if (e.altKey && e.code === "Space") {
        e.preventDefault();
        if (state.mode === "expanded") {
          collapse();
        } else {
          expand();
        }
        return;
      }

      // Escape collapses expanded island
      if (e.key === "Escape" && state.mode === "expanded") {
        e.preventDefault();
        collapse();
        return;
      }

      // Cmd / Ctrl + 1..5 quick tab switcher when expanded
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && state.mode === "expanded") {
        if (e.key === "1") { e.preventDefault(); setActiveFeature("timer"); }
        if (e.key === "2") { e.preventDefault(); setActiveFeature("music"); }
        if (e.key === "3") { e.preventDefault(); setActiveFeature("lyrics"); }
        if (e.key === "4") { e.preventDefault(); setActiveFeature("battery"); }
        if (e.key === "5") { e.preventDefault(); setActiveFeature("settings"); }
      }
    },
    [state.mode, collapse, expand, setActiveFeature]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // When rendered inside the dedicated corner-lyrics window
  if (windowLabel === "corner-lyrics") {
    return (
      <CornerLyrics
        music={state.music}
        onTogglePlay={toggleMusicPlayback}
        onOpenIslandLyrics={() => expand("lyrics")}
      />
    );
  }

  // When rendered inside the dedicated pomodoro-hud window
  if (windowLabel === "pomodoro-hud") {
    return (
      <PomodoroHUD
        timer={state.timer}
        onStart={startTimer}
        onPause={pauseTimer}
        onStop={stopTimer}
      />
    );
  }

  // When rendered in main island window
  return (
    <IslandShell
      state={state}
      onExpand={expand}
      onCollapse={collapse}
      onTabChange={setActiveFeature}
      onStartTimer={startTimer}
      onPauseTimer={pauseTimer}
      onStopTimer={stopTimer}
      onToggleMusic={toggleMusicPlayback}
      onNextMusic={nextTrack}
      onPrevMusic={prevTrack}
      onSeekMusic={seekTrack}
    />
  );
};

export default App;
