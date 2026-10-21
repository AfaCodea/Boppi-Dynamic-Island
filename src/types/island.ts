export type IslandMode = "compact" | "expanded" | "hidden";

export type FeatureTab = "timer" | "music" | "lyrics" | "battery" | "settings";

export type ThemePreference = "auto" | "dark" | "light";

export type ResolvedTheme = "dark" | "light";

export interface ThemeState {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  backgroundLuminance: "dark" | "light";
  luminanceScore: number;
  activeApp: string;
}

export interface LyricLine {
  id: number;
  timeMs: number;
  text: string;
}

export interface TimerState {
  running: boolean;
  paused: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  label: string;
}

export interface MusicState {
  title: string;
  artist: string;
  album: string;
  isPlaying: boolean;
  progressSeconds: number;
  durationSeconds: number;
  currentLyric: string;
  lyrics: LyricLine[];
}

export interface BatteryState {
  percentage: number;
  isCharging: boolean;
  timeRemainingMinutes: number | null;
  health: string;
}

export interface IslandNotificationItem {
  id: string;
  title: string;
  message: string;
  timeLabel?: string;
  category?: "timer" | "battery" | "music" | "system";
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

export interface QuickActionItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  iconName?: string;
  onTrigger: () => void;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  separator?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export type StatusVariant = "idle" | "active" | "live" | "charging" | "warning" | "alert";

export type ActionButtonVariant = "primary" | "secondary" | "subtle" | "ghost" | "danger";

export interface IslandState {
  mode: IslandMode;
  activeFeature: FeatureTab;
  timer: TimerState;
  music: MusicState;
  battery: BatteryState;
  theme: ThemeState;
  notification?: IslandNotificationItem | null;
  hasHardwareNotch?: boolean;
  isLocked?: boolean;
}

export interface AppSettings {
  autoHideFullscreen: boolean;
  showCornerLyrics: boolean;
  compactWidth: number;
  compactHeight: number;
  expandedWidth: number;
  expandedHeight: number;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  shortcut: string;
  notchModel: "mbp14" | "mbp16" | "fallback";
}
