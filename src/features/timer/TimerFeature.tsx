import React from "react";
import { Play, Pause, RotateCcw, Clock, Plus, Zap } from "lucide-react";
import { TimerState } from "../../types/island";

interface Props {
  timer: TimerState;
  onStart: (seconds?: number, label?: string) => void;
  onPause: () => void;
  onStop: () => void;
}

export const TimerFeature: React.FC<Props> = ({ timer, onStart, onPause, onStop }) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPct = timer.totalSeconds > 0
    ? Math.max(0, Math.min(100, Math.round(((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100)))
    : 0;

  const handleAddMinute = () => {
    const nextSecs = timer.remainingSeconds + 60;
    onStart(nextSecs, timer.label);
  };

  return (
    <div className="feature-pane timer-view-v2">
      {/* Left side: Time read-out & Visual elapsed bar */}
      <div className="timer-main-col">
        <div className="timer-meta-row">
          <span className="timer-label-chip">
            <Clock size={10} /> {timer.label}
          </span>
          {timer.running && (
            <span className="live-indicator-pill">
              <span className="pulse-dot" /> Active
            </span>
          )}
        </div>


        <div className="timer-display-row">
          <div className="timer-digits-large">{formatTime(timer.remainingSeconds)}</div>
          
          <button
            type="button"
            className="timer-bump-btn"
            onClick={handleAddMinute}
            title="Add +1 minute"
          >
            <Plus size={10} /> 1m
          </button>
        </div>

        {/* Linear progress track */}
        <div className="timer-progress-track">
          <div className="timer-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Right side: Quick Presets & Primary Action Controls */}
      <div className="timer-controls-col">
        <div className="action-buttons">
          {!timer.running ? (
            <button
              className="btn-primary"
              onClick={() => onStart(timer.remainingSeconds, timer.label)}
              title="Start Timer (Space)"
            >
              <Play size={13} fill="currentColor" /> {timer.paused ? "Resume" : "Start"}
            </button>
          ) : (
            <button
              className="btn-secondary active-pause"
              onClick={onPause}
              title="Pause Timer"
            >
              <Pause size={13} fill="currentColor" /> Pause
            </button>
          )}

          <button
            className="btn-secondary icon-only"
            onClick={onStop}
            title="Reset timer to original duration"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Quick Presets for standard workflows */}
        <div className="timer-presets-row">
          <button
            type="button"
            className="preset-chip"
            onClick={() => onStart(25 * 60, "Pomodoro Focus")}
            title="25 min Pomodoro"
          >
            <Zap size={9} /> 25m
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => onStart(5 * 60, "Short Break")}
            title="5 min Short Break"
          >
            5m
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => onStart(15 * 60, "Long Break")}
            title="15 min Long Break"
          >
            15m
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => onStart(45 * 60, "Deep Work")}
            title="45 min Deep Work"
          >
            45m
          </button>
        </div>
      </div>
    </div>
  );
};

