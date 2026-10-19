import React from "react";
import { ActionButtonVariant } from "../types/island";

export interface IslandActionButtonProps {
  /** Visible button label */
  children: React.ReactNode;
  /** Action variant for visual hierarchy */
  variant?: ActionButtonVariant;
  /** Click event handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Optional leading icon */
  icon?: React.ReactNode;
  /** Optional keyboard shortcut string */
  shortcut?: string;
  /** Loading state indicator */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Accessible aria-label */
  ariaLabel?: string;
  /** Additional custom class */
  className?: string;
  /** Type attribute */
  type?: "button" | "submit" | "reset";
}

/**
 * IslandActionButton: Reusable button primitive adhering to macOS action styling.
 */
export const IslandActionButton: React.FC<IslandActionButtonProps> = ({
  children,
  variant = "secondary",
  onClick,
  icon,
  shortcut,
  loading = false,
  disabled = false,
  ariaLabel,
  className = "",
  type = "button",
}) => {
  return (
    <button
      type={type}
      className={`island-action-btn variant-${variant} ${loading ? "is-loading" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {loading ? (
        <span className="island-btn-spinner" aria-hidden="true" />
      ) : (
        icon && <span className="island-btn-icon">{icon}</span>
      )}
      {children ? <span className="island-btn-label">{children}</span> : null}
      {shortcut && <kbd className="island-btn-shortcut">{shortcut}</kbd>}
    </button>
  );
};
