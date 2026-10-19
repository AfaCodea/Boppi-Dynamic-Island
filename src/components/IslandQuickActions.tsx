import { Play, Coffee, Mic2, VolumeX, Laptop } from "lucide-react";
import { QuickActionItem } from "../types/island";

export interface IslandQuickActionsProps {
  /** Optional custom action items. Default preset actions provided if omitted. */
  actions?: QuickActionItem[];
  /** Default handlers */
  onStartFocus?: () => void;
  onTakeBreak?: () => void;
  onToggleLyricsHUD?: () => void;
  onMute?: () => void;
}

/**
 * IslandQuickActions: Palette of fast, one-tap productivity actions.
 */
export const IslandQuickActions: React.FC<IslandQuickActionsProps> = ({
  actions,
  onStartFocus,
  onTakeBreak,
  onToggleLyricsHUD,
  onMute,
}) => {
  const defaultActions: QuickActionItem[] = [
    {
      id: "focus",
      label: "Start Focus",
      shortcut: "25m",
      onTrigger: onStartFocus || (() => {}),
    },
    {
      id: "break",
      label: "Take Break",
      shortcut: "5m",
      onTrigger: onTakeBreak || (() => {}),
    },
    {
      id: "lyrics",
      label: "Desktop Lyrics",
      shortcut: "HUD",
      onTrigger: onToggleLyricsHUD || (() => {}),
    },
    {
      id: "mute",
      label: "Mute All",
      shortcut: "M",
      onTrigger: onMute || (() => {}),
    },
  ];

  const actionList = actions || defaultActions;

  const renderIcon = (id: string) => {
    switch (id) {
      case "focus":
        return <Play size={12} fill="currentColor" />;
      case "break":
        return <Coffee size={12} />;
      case "lyrics":
        return <Mic2 size={12} />;
      case "mute":
        return <VolumeX size={12} />;
      default:
        return <Laptop size={12} />;
    }
  };

  return (
    <div className="island-quick-actions-grid" role="group" aria-label="Quick Actions">
      {actionList.map((item) => (
        <button
          key={item.id}
          type="button"
          className="quick-action-card"
          onClick={item.onTrigger}
          title={item.label}
        >
          <div className="quick-action-icon-wrap">{renderIcon(item.id)}</div>
          <div className="quick-action-meta">
            <span className="quick-action-title">{item.label}</span>
            {item.shortcut && <kbd className="quick-action-badge">{item.shortcut}</kbd>}
          </div>
        </button>
      ))}
    </div>
  );
};
