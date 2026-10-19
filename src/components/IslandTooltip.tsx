import React, { useState } from "react";

export interface IslandTooltipProps {
  /** Text content displayed inside the tooltip */
  content: string;
  /** Child component that triggers the tooltip on hover/focus */
  children: React.ReactNode;
  /** Tooltip position relative to trigger (default: bottom) */
  position?: "top" | "bottom" | "left" | "right";
  /** Delay in milliseconds before showing tooltip */
  delayMs?: number;
}

/**
 * IslandTooltip: Native macOS style micro-tooltip with accessible keyboard support.
 */
export const IslandTooltip: React.FC<IslandTooltipProps> = ({
  content,
  children,
  position = "bottom",
  delayMs = 200,
}) => {
  const [visible, setVisible] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);

  const handleMouseEnter = () => {
    const id = window.setTimeout(() => setVisible(true), delayMs);
    setTimer(id);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    setVisible(false);
  };

  return (
    <div
      className="island-tooltip-wrap"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`island-tooltip-bubble position-${position}`}
          aria-hidden={!visible}
        >
          {content}
        </div>
      )}
    </div>
  );
};
