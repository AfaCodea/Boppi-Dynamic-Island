import React from "react";
import { ActionButtonVariant } from "../types/island";

export interface IslandIconButtonProps {
  /** Icon element to render inside */
  icon: React.ReactNode;
  /** Accessible title and aria-label */
  title: string;
  /** Click event handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Visual variant (default: ghost) */
  variant?: ActionButtonVariant;
  /** Size in pixels (default: 24) */
  size?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Active / selected state */
  active?: boolean;
  /** Custom class */
  className?: string;
}

/**
 * IslandIconButton: Compact circular or rounded icon trigger with hover states.
 */
export const IslandIconButton: React.FC<IslandIconButtonProps> = ({
  icon,
  title,
  onClick,
  variant = "ghost",
  size = 24,
  disabled = false,
  active = false,
  className = "",
}) => {
  return (
    <button
      type="button"
      className={`island-icon-btn variant-${variant} ${active ? "is-active" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {icon}
    </button>
  );
};
