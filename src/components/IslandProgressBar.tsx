import React from "react";

export interface IslandProgressBarProps {
  /** Progress percentage between 0 and 100 */
  value: number;
  /** Height in pixels (default: 4) */
  height?: number;
  /** Color accent variant (cyan, green, amber, purple, neutral) */
  variant?: "cyan" | "green" | "amber" | "purple" | "white" | "red";
  /** Optional interactive seek callback */
  onSeek?: (percentage: number) => void;
  /** Accessible label */
  label?: string;
  /** Show draggable thumb pill */
  showThumb?: boolean;
  /** Additional custom class */
  className?: string;
}

/**
 * IslandProgressBar: Reusable smooth progress track for timers, playback, and battery.
 */
export const IslandProgressBar: React.FC<IslandProgressBarProps> = ({
  value,
  height = 4,
  variant = "cyan",
  onSeek,
  label = "Progress",
  showThumb = false,
  className = "",
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.round((clickX / rect.width) * 100);
    onSeek(Math.min(100, Math.max(0, percentage)));
  };

  return (
    <div
      className={`island-progress-track ${onSeek ? "is-seekable" : ""} ${className}`}
      style={{ height: `${height}px` }}
      onClick={handleClick}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`island-progress-fill color-${variant}`}
        style={{ width: `${clampedValue}%` }}
      />
      {showThumb && (
        <div
          className="island-progress-thumb"
          style={{ left: `${clampedValue}%` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
