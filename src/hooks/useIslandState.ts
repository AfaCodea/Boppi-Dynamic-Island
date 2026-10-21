import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FeatureTab, IslandState, MusicState, BatteryState, ThemeState, ThemePreference } from "../types/island";
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
  theme: {
    preference: "auto",
    resolvedTheme: "light",
    backgroundLuminance: "dark",
    luminanceScore: 0.12,
    activeApp: "Desktop",
  },
  hasHardwareNotch: false,
};

export function useIslandState() {
  const [state, setState] = useState<IslandState>(defaultInitialState);

  // Sync resolved adaptive theme and background luminance to root HTML attributes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", state.theme.resolvedTheme);
    root.setAttribute("data-bg-luminance", state.theme.backgroundLuminance);
    root.setAttribute("data-theme-pref", state.theme.preference);
    root.setAttribute("data-has-notch", state.hasHardwareNotch ? "true" : "false");
  }, [state.theme.resolvedTheme, state.theme.backgroundLuminance, state.theme.preference, state.hasHardwareNotch]);

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
      setState((prev) => (prev.mode === mode ? prev : { ...prev, mode }));
    },
    onThemeChanged: (theme) => {
      setState((prev) => ({ ...prev, theme }));
    },
    onNotification: (notification) => {
      setState((prev) => ({ ...prev, notification }));
    },
    onSystemLockChanged: (isLocked) => {
      setState((prev) => ({ ...prev, isLocked }));
    },
  });

  // Auto-dismiss transient notifications after 5.5 seconds
  useEffect(() => {
    if (!state.notification) return;
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, notification: null }));
    }, 5500);
    return () => clearTimeout(timer);
  }, [state.notification]);

  // Initial fetch for real media, hardware battery, and adaptive theme state on mount
  useEffect(() => {
    async function initSystemTelemetry() {
      try {
        const liveTheme = await invoke<ThemeState>("get_theme_state");
        if (liveTheme && liveTheme.resolvedTheme) {
          setState((prev) => ({ ...prev, theme: liveTheme }));
        }
      } catch {
        // Fallback in web browser preview: invert against system color scheme
        const isSystemDark =
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        setState((prev) => ({
          ...prev,
          theme: {
            preference: "auto",
            resolvedTheme: isSystemDark ? "light" : "dark",
            backgroundLuminance: isSystemDark ? "dark" : "light",
            luminanceScore: isSystemDark ? 0.12 : 0.88,
            activeApp: "System",
          },
        }));
      }

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

      try {
        const hasNotch = await invoke<boolean>("check_hardware_notch");
        setState((prev) => ({ ...prev, hasHardwareNotch: Boolean(hasNotch) }));
      } catch {
        setState((prev) => ({ ...prev, hasHardwareNotch: false }));
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

  const expand = useCallback((tab?: FeatureTab) => {
    // 1. Optimistic UI update on the exact click frame for immediate 120fps morph
    setState((prev) => ({
      ...prev,
      mode: "expanded",
      activeFeature: tab || prev.activeFeature,
    }));
    // 2. Concurrently signal native macOS overlay
    invoke("expand_island").catch(() => {});
  }, []);

  const collapse = useCallback(() => {
    // 1. Optimistic UI update on the exact click frame
    setState((prev) => ({ ...prev, mode: "compact" }));
    // 2. Concurrently signal native macOS overlay
    invoke("collapse_island").catch(() => {});
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

  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    try {
      const updated = await invoke<ThemeState>("set_theme_preference", { preference });
      setState((prev) => ({ ...prev, theme: updated }));
    } catch {
      setState((prev) => {
        const isDarkBg = prev.theme.backgroundLuminance === "dark";
        const resolvedTheme =
          preference === "auto"
            ? isDarkBg
              ? "light"
              : "dark"
            : preference;
        return {
          ...prev,
          theme: {
            ...prev.theme,
            preference,
            resolvedTheme,
          },
        };
      });
    }
  }, []);

  const cycleThemePreference = useCallback(() => {
    const order: ThemePreference[] = ["auto", "light", "dark"];
    const nextIdx = (order.indexOf(state.theme.preference) + 1) % order.length;
    setThemePreference(order[nextIdx]);
  }, [state.theme.preference, setThemePreference]);

  const dismissNotification = useCallback(() => {
    setState((prev) => ({ ...prev, notification: null }));
  }, []);

  const sendNotification = useCallback(
    async (title: string, message: string, category?: string, actionLabel?: string) => {
      try {
        await invoke("send_notification", {
          title,
          message,
          category,
          actionLabel,
        });
      } catch {
        setState((prev) => ({
          ...prev,
          notification: {
            id: `local-${Date.now()}`,
            title,
            message,
            category: (category as any) || "system",
            timeLabel: "Now",
            actionLabel,
          },
        }));
      }
    },
    []
  );

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
    setThemePreference,
    cycleThemePreference,
    dismissNotification,
    sendNotification,
  };
}
