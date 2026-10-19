import React, { useState } from "react";
import { Play, Pause, RotateCcw, Plus, Sparkles, CheckCircle2, Monitor } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { TimerState } from "../types/island";
import { IslandActionButton } from "./IslandActionButton";
import { IslandProgressBar } from "./IslandProgressBar";
import { playPopSound } from "../utils/audio";

export interface IslandTimerProps {
  /** Current timer state payload */
  timer: TimerState;
  /** Start timer event callback */
  onStart: (seconds?: number, label?: string) => void;
  /** Pause timer event callback */
  onPause: () => void;
  /** Reset / stop timer event callback */
  onStop: () => void;
  /** Quick add seconds (e.g. +60 for +1m) */
  onAddSeconds?: (seconds: number) => void;
}

/**
 * IslandTimer: Precision monotonic timer & Pomodoro productivity controller.
 */
export const IslandTimer: React.FC<IslandTimerProps> = ({
  timer,
  onStart,
  onPause,
  onStop,
  onAddSeconds,
}) => {
  const [isPopping, setIsPopping] = useState(false);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPct =
    timer.totalSeconds > 0
      ? Math.min(100, Math.round(((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100))
      : 0;

  const isCompleted = timer.remainingSeconds === 0 && timer.totalSeconds > 0;

  const handleStartWithPop = (seconds?: number, label?: string) => {
    setIsPopping(true);
    playPopSound();
    setTimeout(() => setIsPopping(false), 600);
    onStart(seconds, label);
  };

  const handleToggleScreenHUD = async () => {
    playPopSound();
    try {
      await invoke("show_pomodoro_hud");
    } catch {
      // preview fallback
    }
  };

  return (
    <div
      className={`feature-pane island-timer-pane ${isPopping ? "timer-pop-pulse" : ""}`}
      role="region"
      aria-label="Timer Controls"
    >
      {/* Time Display and Bump Column */}
      <div className="timer-main-col">
        <div className="timer-meta-row">
          <span className="timer-label-chip">
            <Sparkles size={11} aria-hidden="true" />
            <span>{timer.label || "Focus Session"}</span>
          </span>
          {timer.running && (
            <span className="live-indicator-pill">
              <span className="pulse-dot" />
              <span>Active</span>
            </span>
          )}
          {isCompleted && (
            <span className="live-indicator-pill" style={{ color: "var(--island-accent-green)" }}>
              <CheckCircle2 size={10} />
              <span>Completed</span>
            </span>
          )}
          <button
            type="button"
            className="hud-screen-toggle-pill"
            onClick={handleToggleScreenHUD}
            title="Tampilkan timer floating di tengah layar"
          >
            <Monitor size={10} />
            <span>HUD Layar</span>
          </button>
        </div>

        <div className="timer-display-row">
          <span className="timer-digits-large" aria-live="polite">
            {formatTime(timer.remainingSeconds)}
          </span>
          <button
            type="button"
            className="timer-bump-btn"
            onClick={() => {
              playPopSound();
              if (onAddSeconds) onAddSeconds(60);
              else onStart(timer.remainingSeconds + 60);
            }}
            title="Add 1 minute"
          >
            <Plus size={10} aria-hidden="true" />
            <span>1m</span>
          </button>
        </div>

        {/* Progress track */}
        <IslandProgressBar
          value={progressPct}
          variant="cyan"
          label="Elapsed Timer Progress"
          height={4}
        />
      </div>

      {/* Action Controls & Presets */}
      <div className="timer-controls-col">
        <div className="action-buttons">
          {timer.running ? (
            <IslandActionButton
              variant="secondary"
              onClick={onPause}
              icon={<Pause size={13} fill="currentColor" />}
              ariaLabel="Pause Timer"
            >
              Pause
            </IslandActionButton>
          ) : (
            <div className="pop-btn-container">
              {isPopping && <span className="shockwave-ring" />}
              <IslandActionButton
                variant="primary"
                onClick={() => handleStartWithPop()}
                icon={<Play size={13} fill="currentColor" />}
                ariaLabel="Start Timer"
                className={isPopping ? "btn-spring-popping" : ""}
              >
                Start
              </IslandActionButton>
            </div>
          )}

          <IslandActionButton
            variant="secondary"
            onClick={onStop}
            icon={<RotateCcw size={12} />}
            ariaLabel="Reset Timer"
            className="icon-only"
          >
            {null}
          </IslandActionButton>
        </div>

        {/* Preset quick pills */}
        <div className="timer-presets-row" role="group" aria-label="Quick Presets">
          <button
            type="button"
            className={`preset-chip ${isPopping ? "preset-pop" : ""}`}
            onClick={() => handleStartWithPop(25 * 60, "Pomodoro Focus")}
            title="Start 25 min Pomodoro"
          >
            25m
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => handleStartWithPop(5 * 60, "Short Break")}
            title="Start 5 min Short Break"
          >
            5m
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => handleStartWithPop(15 * 60, "Long Break")}
            title="Start 15 min Long Break"
          >
            15m
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => handleStartWithPop(45 * 60, "Deep Focus")}
            title="Start 45 min Deep Focus"
          >
            45m
          </button>
        </div>
      </div>
    </div>
  );
};
