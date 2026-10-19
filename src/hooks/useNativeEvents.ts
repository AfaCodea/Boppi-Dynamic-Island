import { useEffect, useRef } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { TimerState, MusicState, BatteryState, IslandMode } from "../types/island";

interface NativeEventListeners {
  onTimerTick?: (state: TimerState) => void;
  onMusicChanged?: (state: MusicState) => void;
  onBatteryUpdated?: (state: BatteryState) => void;
  onStateChanged?: (state: { mode: IslandMode }) => void;
}

export function useNativeEvents(listeners: NativeEventListeners) {
  const listenersRef = useRef(listeners);
  listenersRef.current = listeners;

  useEffect(() => {
    let unlisteners: UnlistenFn[] = [];
    let isMounted = true;

    const setupListeners = async () => {
      try {
        const uTimer = await listen<TimerState>("timer-tick", (event) => {
          if (isMounted) listenersRef.current.onTimerTick?.(event.payload);
        });
        unlisteners.push(uTimer);

        const uMusic = await listen<MusicState>("music-changed", (event) => {
          if (isMounted) listenersRef.current.onMusicChanged?.(event.payload);
        });
        unlisteners.push(uMusic);

        const uBattery = await listen<BatteryState>("battery-updated", (event) => {
          if (isMounted) listenersRef.current.onBatteryUpdated?.(event.payload);
        });
        unlisteners.push(uBattery);

        const uState = await listen<{ mode: IslandMode }>("island-state-changed", (event) => {
          if (isMounted) listenersRef.current.onStateChanged?.(event.payload);
        });
        unlisteners.push(uState);
      } catch {
        // Fallback for browser preview mode
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      unlisteners.forEach((u) => u());
    };
  }, []);
}
