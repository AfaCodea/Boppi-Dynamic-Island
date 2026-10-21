import React from "react";
import {
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
} from "lucide-react";

export interface BatteryGlyphProps {
  /** Battery percentage (0 - 100) */
  percentage: number;
  /** Whether the power adapter is actively connected/charging */
  isCharging: boolean;
  /** Icon pixel size (default 13px) */
  size?: number;
  /** Extra CSS classes */
  className?: string;
}

/**
 * BatteryGlyph: Adaptive battery status icon.
 * - When plugged in: Displays active charging bolt glyph.
 * - When unplugged: Changes to fullness level (Full, Medium, Low, Warning) based on percentage.
 */
export const BatteryGlyph: React.FC<BatteryGlyphProps> = ({
  percentage,
  isCharging,
  size = 13,
  className = "",
}) => {
  // Plugged in / Charging state
  if (isCharging) {
    return (
      <BatteryCharging
        size={size}
        className={`battery-glyph is-charging ${className}`}
        aria-hidden="true"
      />
    );
  }

  // Unplugged: Dynamic fullness level according to percentage
  if (percentage >= 75) {
    return (
      <BatteryFull
        size={size}
        className={`battery-glyph is-full ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (percentage >= 35) {
    return (
      <BatteryMedium
        size={size}
        className={`battery-glyph is-medium ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (percentage >= 15) {
    return (
      <BatteryLow
        size={size}
        className={`battery-glyph is-low ${className}`}
        aria-hidden="true"
      />
    );
  }

  // Critical battery (< 15%)
  return (
    <BatteryWarning
      size={size}
      className={`battery-glyph is-critical ${className}`}
      aria-hidden="true"
    />
  );
};
