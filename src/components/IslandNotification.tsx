import { Bell, X, AlertCircle, Info, Sparkles } from "lucide-react";
import { IslandNotificationItem } from "../types/island";
import { IslandActionButton } from "./IslandActionButton";

export interface IslandNotificationProps {
  /** Notification payload */
  notification: IslandNotificationItem;
  /** Dismiss callback */
  onDismiss: () => void;
  /** Action trigger */
  onAction?: () => void;
}

/**
 * IslandNotification: Interactive banner preview for notifications without
 * mimicking or interfering with macOS system banners.
 */
export const IslandNotification: React.FC<IslandNotificationProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  const getCategoryIcon = () => {
    switch (notification.category) {
      case "timer":
        return <Sparkles size={13} className="notif-icon-category timer" />;
      case "battery":
        return <AlertCircle size={13} className="notif-icon-category battery" />;
      case "music":
        return <Info size={13} className="notif-icon-category music" />;
      default:
        return <Bell size={13} className="notif-icon-category default" />;
    }
  };

  return (
    <div className="island-notification-banner" role="alert" aria-live="polite">
      <div className="notif-leading-col">
        {getCategoryIcon()}
      </div>

      <div className="notif-content-col">
        <div className="notif-header-line">
          <span className="notif-title">{notification.title}</span>
          {notification.timeLabel && <span className="notif-time">{notification.timeLabel}</span>}
        </div>
        <div className="notif-message">{notification.message}</div>
      </div>

      <div className="notif-actions-col">
        {notification.actionLabel && (
          <IslandActionButton
            variant="primary"
            onClick={onAction || notification.onAction}
            className="notif-action-btn"
          >
            {notification.actionLabel}
          </IslandActionButton>
        )}
        <button
          type="button"
          className="notif-dismiss-btn"
          onClick={onDismiss}
          title="Dismiss preview"
          aria-label="Dismiss notification preview"
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
