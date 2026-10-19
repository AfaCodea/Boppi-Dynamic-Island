import React from "react";
import { FeatureTab, IslandState } from "../types/island";
import { IslandCompact } from "./IslandCompact";
import { IslandExpanded } from "./IslandExpanded";

export interface IslandShellProps {
  /** Root application state */
  state: IslandState;
  /** Expand island callback */
  onExpand: (tab?: FeatureTab) => void;
  /** Collapse island callback */
  onCollapse: () => void;
  /** Tab switch callback */
  onTabChange: (tab: FeatureTab) => void;
  /** Timer action callbacks */
  onStartTimer: (seconds?: number, label?: string) => void;
  onPauseTimer: () => void;
  onStopTimer: () => void;
  /** Music toggle callback */
  onToggleMusic: () => void;
  /** Real macOS media control callbacks */
  onNextMusic?: () => void;
  onPrevMusic?: () => void;
  onSeekMusic?: (seconds: number) => void;
}

/**
 * IslandShell: Root container managing notch ear cutouts, keyboard triggers,
 * and seamless morphing between compact notch and expanded control surface.
 */
export const IslandShell: React.FC<IslandShellProps> = ({
  state,
  onExpand,
  onCollapse,
  onTabChange,
  onStartTimer,
  onPauseTimer,
  onStopTimer,
  onToggleMusic,
  onNextMusic,
  onPrevMusic,
  onSeekMusic,
}) => {
  const isExpanded = state.mode === "expanded";

  const handleShellClick = () => {
    if (!isExpanded) {
      onExpand();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === "Enter" || e.key === " ") && !isExpanded) {
      e.preventDefault();
      onExpand();
    } else if (e.key === "Escape" && isExpanded) {
      e.preventDefault();
      onCollapse();
    }
  };

  return (
    <div className="island-container">
      <div
        className={`island-shell ${isExpanded ? "expanded" : "compact"}`}
        onClick={handleShellClick}
        onKeyDown={handleKeyDown}
        role={isExpanded ? "region" : "button"}
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Boppi Controls" : "Boppi Capsule"}
      >
        {isExpanded ? (
          <IslandExpanded
            state={state}
            onTabChange={onTabChange}
            onClose={onCollapse}
            onStartTimer={onStartTimer}
            onPauseTimer={onPauseTimer}
            onStopTimer={onStopTimer}
            onToggleMusic={onToggleMusic}
            onNextMusic={onNextMusic}
            onPrevMusic={onPrevMusic}
            onSeekMusic={onSeekMusic}
          />
        ) : (
          <IslandCompact
            state={state}
            onSelectFeature={(tab) => onExpand(tab)}
            onExpand={() => onExpand()}
          />
        )}
      </div>
    </div>
  );
};
