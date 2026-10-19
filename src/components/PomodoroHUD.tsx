import React, { useState, useRef, useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { invoke } from "@tauri-apps/api/core";
import { Play, Pause, RotateCcw, Plus, X, Layers } from "lucide-react";
import { TimerState } from "../types/island";
import { BoppiAvatar } from "./BoppiAvatar";
import { playPopSound } from "../utils/audio";

interface Props {
  timer: TimerState;
  onStart?: (seconds?: number, label?: string) => void;
  onPause?: () => void;
  onStop?: () => void;
}

type OpacityPreset = "ambient" | "balanced" | "solid";

export const PomodoroHUD: React.FC<Props> = ({ timer, onStart, onPause, onStop }) => {
  const [opacityPreset, setOpacityPreset] = useState<OpacityPreset>("balanced");
  const [mascotPopping, setMascotPopping] = useState(true);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Ensure window is sized properly across all DPI displays
  useEffect(() => {
    try {
      const appWindow = getCurrentWebviewWindow();
      appWindow.setSize(new LogicalSize(380, 240));
    } catch {
      // preview fallback
    }
  }, []);

  // Trigger mascot pop on mount or when timer status toggles to running
  useEffect(() => {
    setMascotPopping(true);
    const timerId = setTimeout(() => setMascotPopping(false), 800);
    return () => clearTimeout(timerId);
  }, [timer.running]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPct =
    timer.totalSeconds > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100)
          )
        )
      : 0;

  // Window drag handling
  const handleMouseDown = async (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = false;
      startPosRef.current = { x: e.screenX, y: e.screenY };
      try {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.startDragging();
      } catch {
        // Fallback for browser preview
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const dx = Math.abs(e.screenX - startPosRef.current.x);
    const dy = Math.abs(e.screenY - startPosRef.current.y);
    if (dx > 4 || dy > 4) {
      isDraggingRef.current = true;
    }
  };

  const cycleOpacity = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPopSound();
    if (opacityPreset === "ambient") setOpacityPreset("balanced");
    else if (opacityPreset === "balanced") setOpacityPreset("solid");
    else setOpacityPreset("ambient");
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke("hide_pomodoro_hud");
    } catch {
      try {
        const win = getCurrentWebviewWindow();
        await win.hide();
      } catch {
        // preview
      }
    }
  };

  const handleAddMinutes = (mins: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMascotPopping(true);
    setTimeout(() => setMascotPopping(false), 600);
    playPopSound();
    if (onStart) {
      onStart(timer.remainingSeconds + mins * 60, timer.label);
    }
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMascotPopping(true);
    setTimeout(() => setMascotPopping(false), 600);
    playPopSound();
    if (timer.running) {
      onPause?.();
    } else {
      onStart?.(timer.remainingSeconds || 1500, timer.label);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMascotPopping(true);
    setTimeout(() => setMascotPopping(false), 600);
    onStop?.();
  };

  return (
    <div
      className={`pomodoro-hud-root opacity-${opacityPreset}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      data-tauri-drag-region
      title="Tahan & drag untuk memindahkan timer ke mana saja"
    >
      <div className="pomodoro-hud-card" data-tauri-drag-region>
        {/* Top telemetry bar */}
        <div className="pomodoro-hud-topbar" data-tauri-drag-region>
          <div className="pomodoro-hud-top-left" data-tauri-drag-region>
            <span className="hud-status-indicator">
              <span className={`pulse-dot ${timer.running ? "live-green" : ""}`} />
              <span>{timer.running ? "Running" : timer.paused ? "Paused" : "Ready"}</span>
            </span>
          </div>

          {/* Quick HUD controls */}
          <div className="pomodoro-hud-actions" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="hud-tool-btn"
              onClick={cycleOpacity}
              title={`Ubah Opacity (Saat ini: ${opacityPreset})`}
            >
              <Layers size={11} />
              <span className="hud-opacity-label">
                {opacityPreset === "ambient" ? "40%" : opacityPreset === "balanced" ? "65%" : "88%"}
              </span>
            </button>
            <button
              type="button"
              className="hud-tool-btn close-btn"
              onClick={handleClose}
              title="Sembunyikan HUD (Timer tetap berjalan di Dynamic Island)"
            >
              <X size={11} />
            </button>
          </div>
        </div>

        {/* Center Stage: Icon lucu pop FIRST, then Pomodoro title and smooth countdown time */}
        <div className="pomodoro-hud-center" data-tauri-drag-region>
          {/* Step 1: Cute Mascot Icon pops in first */}
          <div
            className={`hud-center-mascot-wrapper ${mascotPopping ? "mascot-popping" : ""}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <BoppiAvatar
              size={36}
              mood={timer.running ? "focus" : timer.remainingSeconds === 0 ? "happy" : "wink"}
              interactive={true}
              bubblePlacement="top"
              showBubbleOnPoke={true}
            />
          </div>

          {/* Step 2: Pomodoro title & countdown digits smoothly revealed */}
          <div className="hud-time-smooth-group" data-tauri-drag-region>
            <div className="hud-pomodoro-title-clean">
              <span className="hud-pomodoro-text">Pomodoro</span>
              {timer.label &&
                timer.label !== "Pomodoro" &&
                timer.label !== "Pomodoro Focus" && (
                  <span className="hud-label-extra">{timer.label}</span>
                )}
            </div>

            <div className="hud-digits-wrapper" data-tauri-drag-region>
              <span className="hud-time-digits">{formatTime(timer.remainingSeconds)}</span>
            </div>

            {/* Glowing smooth progress track */}
            <div className="hud-progress-container" data-tauri-drag-region>
              <div className="hud-progress-track">
                <div
                  className="hud-progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quick Control Bar */}
        <div className="pomodoro-hud-footer" onMouseDown={(e) => e.stopPropagation()}>
          <div className="hud-time-bumps">
            <button
              type="button"
              className="hud-bump-pill"
              onClick={(e) => handleAddMinutes(1, e)}
              title="Tambah 1 menit"
            >
              <Plus size={10} /> 1m
            </button>
            <button
              type="button"
              className="hud-bump-pill"
              onClick={(e) => handleAddMinutes(5, e)}
              title="Tambah 5 menit"
            >
              <Plus size={10} /> 5m
            </button>
          </div>

          <div className="hud-primary-controls">
            <button
              type="button"
              className={`hud-play-btn ${timer.running ? "is-running" : "is-paused"}`}
              onClick={handleTogglePlay}
              title={timer.running ? "Jeda Timer (Pause)" : "Lanjutkan Timer (Play)"}
            >
              {timer.running ? (
                <>
                  <Pause size={12} fill="currentColor" /> Jeda
                </>
              ) : (
                <>
                  <Play size={12} fill="currentColor" /> Mulai
                </>
              )}
            </button>
            <button
              type="button"
              className="hud-reset-btn"
              onClick={handleReset}
              title="Reset ke durasi awal"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
