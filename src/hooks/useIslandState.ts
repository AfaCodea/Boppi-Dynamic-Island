import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FeatureTab, IslandState, MusicState, BatteryState } from "../types/island";
import { useNativeEvents } from "./useNativeEvents";
import { fetchSyncedLyrics } from "../services/lyricsFetcher";

const defaultInitialState: IslandState = {
  mode: "compact",
  activeFeature: "music",
  timer: {
    running: false,
    paused: false,
    remainingSeconds: 25 * 60,
    totalSeconds: 25 * 60,
    label: "Pomodoro Focus",
  },
  music: {
    title: "Connecting to Media...",
    artist: "Spotify / Apple Music",
    album: "macOS Media",
    isPlaying: false,
    progressSeconds: 0,
    durationSeconds: 0,
    currentLyric: "Play music in Spotify or Apple Music to stream lyrics",
    lyrics: [],
  },
  battery: {
    percentage: 100,
    isCharging: false,
    timeRemainingMinutes: null,
    health: "Normal",
  },
};

export function useIslandState() {
  const [state, setState] = useState<IslandState>(defaultInitialState);

  // Bind native real-time events
  useNativeEvents({
    onTimerTick: (timer) => {
      setState((prev) => ({ ...prev, timer }));
    },
    onMusicChanged: (incomingMusic) => {
      setState((prev) => {
        const isSameTrack =
          prev.music.title === incomingMusic.title &&
          prev.music.artist === incomingMusic.artist;

        // If same track and we already have rich synced lyrics (>2 lines), preserve them!
        const lyricsToKeep =
          isSameTrack && prev.music.lyrics.length > 2 && incomingMusic.lyrics.length <= 2
            ? prev.music.lyrics
            : incomingMusic.lyrics;

        return {
          ...prev,
          music: {
            ...incomingMusic,
            lyrics: lyricsToKeep,
          },
        };
      });
    },
    onBatteryUpdated: (battery) => {
      setState((prev) => ({ ...prev, battery }));
    },
    onStateChanged: ({ mode }) => {
      setState((prev) => ({ ...prev, mode }));
    },
  });

  // Initial fetch for real media & hardware battery state on mount
  useEffect(() => {
    async function initSystemTelemetry() {
      try {
        const liveMusic = await invoke<MusicState>("get_music_track");
        if (liveMusic && liveMusic.title) {
          setState((prev) => ({ ...prev, music: liveMusic }));
        }
      } catch {
        // Fallback in web browser preview
      }

      try {
        const liveBattery = await invoke<BatteryState>("get_battery_status");
        if (liveBattery && typeof liveBattery.percentage === "number") {
          setState((prev) => ({ ...prev, battery: liveBattery }));
        }
      } catch {
        // Fallback in web browser preview
      }
    }

    initSystemTelemetry();
  }, []);

  // Fetch real synced lyrics from LRCLIB for current playing song
  useEffect(() => {
    let cancelled = false;

    async function updateLyrics() {
      if (
        !state.music.title ||
        state.music.title === "Connecting to Media..." ||
        state.music.title.startsWith("♪ Playing:")
      ) {
        return;
      }

      // If we already have synced lyrics for this title, avoid re-fetching
      if (state.music.lyrics.length > 2) {
        return;
      }

      const synced = await fetchSyncedLyrics(
        state.music.title,
        state.music.artist,
        state.music.durationSeconds
      );
      if (!cancelled && synced && synced.length > 0) {
        setState((prev) => ({
          ...prev,
          music: {
            ...prev.music,
            lyrics: synced,
          },
        }));
      }
    }

    updateLyrics();
    return () => {
      cancelled = true;
    };
  }, [state.music.title, state.music.artist, state.music.lyrics.length]);

  const expand = useCallback(async (tab?: FeatureTab) => {
    try {
      await invoke("expand_island");
    } catch {
      // preview fallback
    }
    setState((prev) => ({
      ...prev,
      mode: "expanded",
      activeFeature: tab || prev.activeFeature,
    }));
  }, []);

  const collapse = useCallback(async () => {
    try {
      await invoke("collapse_island");
    } catch {
      // preview fallback
    }
    setState((prev) => ({ ...prev, mode: "compact" }));
  }, []);

  const setActiveFeature = useCallback((tab: FeatureTab) => {
    setState((prev) => ({ ...prev, activeFeature: tab }));
  }, []);

  const startTimer = useCallback(async (seconds?: number, label?: string) => {
    try {
      await invoke("start_timer", { durationSeconds: seconds || 1500, label: label || "Focus" });
    } catch {
      // preview local simulation
      setState((prev) => ({
        ...prev,
        timer: {
          ...prev.timer,
          running: true,
          paused: false,
          remainingSeconds: seconds || prev.timer.remainingSeconds,
          totalSeconds: seconds || prev.timer.totalSeconds,
          label: label || prev.timer.label,
        },
      }));
    }
  }, []);

  const pauseTimer = useCallback(async () => {
    try {
      await invoke("pause_timer");
    } catch {
      setState((prev) => ({
        ...prev,
        timer: { ...prev.timer, running: false, paused: true },
      }));
    }
  }, []);

  const stopTimer = useCallback(async () => {
    try {
      await invoke("stop_timer");
    } catch {
      setState((prev) => ({
        ...prev,
        timer: {
          ...prev.timer,
          running: false,
          paused: false,
          remainingSeconds: prev.timer.totalSeconds,
        },
      }));
    }
  }, []);

  const toggleMusicPlayback = useCallback(async () => {
    try {
      const updated = await invoke<MusicState>("toggle_music");
      setState((prev) => ({ ...prev, music: updated }));
    } catch {
      setState((prev) => ({
        ...prev,
        music: { ...prev.music, isPlaying: !prev.music.isPlaying },
      }));
    }
  }, []);

  const nextTrack = useCallback(async () => {
    try {
      const updated = await invoke<MusicState>("next_music_track");
      setState((prev) => ({ ...prev, music: updated }));
    } catch {
      // preview fallback
    }
  }, []);

  const prevTrack = useCallback(async () => {
    try {
      const updated = await invoke<MusicState>("prev_music_track");
      setState((prev) => ({ ...prev, music: updated }));
    } catch {
      // preview fallback
    }
  }, []);

  const seekTrack = useCallback(async (seconds: number) => {
    try {
      const updated = await invoke<MusicState>("seek_music", { seconds });
      setState((prev) => ({ ...prev, music: updated }));
    } catch {
      // preview fallback
    }
  }, []);

  return {
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
  };
}
