import React, { useEffect, useRef } from "react";
import { ContextMenuItem } from "../types/island";

export interface IslandContextMenuProps {
  /** Menu items list */
  items: ContextMenuItem[];
  /** Position coordinates */
  position: { x: number; y: number } | null;
  /** Close callback */
  onClose: () => void;
}

/**
 * IslandContextMenu: Native macOS style dark popup menu for secondary right-click actions.
 */
export const IslandContextMenu: React.FC<IslandContextMenuProps> = ({
  items,
  position,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (position) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [position, onClose]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="island-context-menu"
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      role="menu"
      aria-label="Island contextual actions"
    >
      {items.map((item) => {
        if (item.separator) {
          return <div key={item.id} className="context-menu-separator" role="separator" />;
        }

        return (
          <button
            key={item.id}
            type="button"
            className={`context-menu-item ${item.danger ? "is-danger" : ""} ${
              item.disabled ? "is-disabled" : ""
            }`}
            onClick={() => {
              if (item.disabled) return;
              item.onClick?.();
              onClose();
            }}
            disabled={item.disabled}
            role="menuitem"
          >
            {item.icon && <span className="context-menu-icon">{item.icon}</span>}
            <span className="context-menu-label">{item.label}</span>
            {item.shortcut && <kbd className="context-menu-shortcut">{item.shortcut}</kbd>}
          </button>
        );
      })}
    </div>
  );
};
