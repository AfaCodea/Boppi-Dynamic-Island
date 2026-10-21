import React, { useState, useEffect } from "react";
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

  const cycleOpacity = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPopSound();
    setOpacityPreset((prev) => {
      if (prev === "ambient") return "balanced";
      if (prev === "balanced") return "solid";
      return "ambient";
    });
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

  const handleAddMinutes = async (mins: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMascotPopping(true);
    setTimeout(() => setMascotPopping(false), 600);
    playPopSound();
    try {
      await invoke("add_timer_seconds", { seconds: mins * 60 });
    } catch {
      if (onStart) {
        onStart(timer.remainingSeconds + mins * 60, timer.label);
      }
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

  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMascotPopping(true);
    setTimeout(() => setMascotPopping(false), 600);
    playPopSound();
    try {
      await invoke("reset_timer");
    } catch {
      onStop?.();
    }
  };

  const handleCardMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    // Don't drag if user clicked any button or mascot avatar
    if (
      !target ||
      target.closest("button") ||
      target.closest(".hud-center-mascot-wrapper") ||
      target.closest(".boppi-avatar-wrapper")
    ) {
      return;
    }

    try {
      const appWindow = getCurrentWebviewWindow();
      await appWindow.startDragging();
    } catch {
      // Fallback for browser preview
    }
  };

  const handleMouseEnter = () => {
    try {
      const appWindow = getCurrentWebviewWindow();
      appWindow.setFocus().catch(() => {});
    } catch {}
  };

  return (
    <div
      className={`pomodoro-hud-root opacity-${opacityPreset}`}
      onMouseEnter={handleMouseEnter}
      title="Tahan & drag untuk memindahkan timer ke mana saja"
    >
      <div
        className="pomodoro-hud-card"
        onMouseDown={handleCardMouseDown}
      >
        {/* Top telemetry bar */}
        <div className="pomodoro-hud-topbar">
          <div className="pomodoro-hud-top-left">
            <span className="hud-status-indicator">
              <span className={`pulse-dot ${timer.running ? "live-green" : ""}`} />
              <span>{timer.running ? "Running" : timer.paused ? "Paused" : "Ready"}</span>
            </span>
          </div>

          {/* Quick HUD controls */}
          <div className="pomodoro-hud-actions">
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
        <div className="pomodoro-hud-center">
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
          <div className="hud-time-smooth-group">
            <div className="hud-pomodoro-title-clean">
              <span className="hud-pomodoro-text">Pomodoro</span>
              {timer.label &&
                timer.label !== "Pomodoro" &&
                timer.label !== "Pomodoro Focus" && (
                  <span className="hud-label-extra">{timer.label}</span>
                )}
            </div>

            <div className="hud-digits-wrapper">
              <span className="hud-time-digits">{formatTime(timer.remainingSeconds)}</span>
            </div>

            {/* Glowing smooth progress track */}
            <div className="hud-progress-container">
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
        <div className="pomodoro-hud-footer">
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
