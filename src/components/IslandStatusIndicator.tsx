import React from "react";
import { StatusVariant } from "../types/island";

export interface IslandStatusIndicatorProps {
  /** The current visual state variant */
  variant: StatusVariant;
  /** Optional readable label */
  label?: string;
  /** Whether the indicator should have a subtle pulse animation */
  pulse?: boolean;
  /** Optional custom CSS class name */
  className?: string;
}

/**
 * IslandStatusIndicator: Reusable micro status dot and live indicator pill
 * conforming to Apple's restrained color system.
 */
export const IslandStatusIndicator: React.FC<IslandStatusIndicatorProps> = ({
  variant,
  label,
  pulse = false,
  className = "",
}) => {
  return (
    <span
      className={`island-status-badge variant-${variant} ${pulse ? "is-pulsing" : ""} ${className}`}
      role="status"
      aria-label={label || variant}
    >
      <span className="status-dot" aria-hidden="true" />
      {label && <span className="status-label">{label}</span>}
    </span>
  );
};
