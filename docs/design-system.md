# macOS Dynamic Island — Design System & Visual Specification

Target Hardware: MacBook Pro 14-inch & 16-inch (2021, M1 Pro / M1 Max) & Universal macOS.

## 1. Design Philosophy

- **True Pitch Black Base (`#000000`)**: Blends seamlessly with the physical MacBook Pro display notch and bezel without unnatural borders or washed-out grays.
- **Tonal Separation via Dark Charcoal**: Layered depths using `#121216`, `#181820`, and `#22222a`.
- **Zero Excessive Glow or Heavy Shadows**: Follows Apple's restraint guidelines; avoids distracting saturated shadows or blurry glassmorphism that causes rendering lag on high-DPI displays.
- **Physical Camera Hardware Anchor**: A simulated center camera element featuring sapphire lens glint and a subtle green FaceTime sensor indicator.
- **MacBook M-Series Ear Curvatures**: Dynamic Island shell utilizes smooth outward curved ear masks (`::before` and `::after` with solid black fill) fusing the notch smoothly into the top display frame.

---

## 2. Centralized Design Tokens (`design-tokens.css`)

### Color System
```css
:root {
  --island-bg: #000000;
  --island-surface: #121216;
  --island-surface-raised: #181820;
  --island-surface-hover: #22222a;
  --island-surface-active: #2a2a34;

  --island-border: #24242e;
  --island-border-subtle: #1a1a20;
  --island-border-focus: #3e3e4e;

  --island-text-primary: #ffffff;
  --island-text-secondary: #9e9ea6;
  --island-text-muted: #666672;

  --island-accent-cyan: #38bdf8;
  --island-accent-blue: #3b82f6;
  --island-accent-green: #34c759;
  --island-accent-amber: #f59e0b;
  --island-accent-red: #ff453a;
  --island-accent-purple: #a855f7;
}
```

### Geometry & Sizing Tokens
| Token | Value | Target Context |
|---|---|---|
| `--island-notch-width` | `210px` | 14" MacBook Pro Notch Baseline |
| `--island-notch-height` | `34px` | Menu Bar Height Baseline |
| `--island-compact-hover-width` | `236px` | Interactive Hover Expansion |
| `--island-expanded-width` | `420px` | Dropdown Contextual Hub Width |
| `--island-expanded-height` | `176px` | Dropdown Contextual Hub Height |
| `--island-radius-compact` | `18px` | Bottom Pill Curvature |
| `--island-radius-expanded` | `28px` | Bottom Dropdown Curvature |

### Motion & Transitions
- Transition Curve: `cubic-bezier(0.16, 1, 0.3, 1)` (Apple standard spring easing).
- Expansion Duration: `240ms`.
- Minor Interactive Hover: `150ms`.
- Reduced Motion: Automatic fallback via `@media (prefers-reduced-motion: reduce)` reducing transition times to `0.01ms`.

---

## 3. Custom Component Architecture

All components reside in `src/components/` and are fully typed with TypeScript interfaces:

1. `IslandShell`: Root container with notch ear pseudo-elements, keyboard triggers, and transition states.
2. `IslandCompact`: Notch capsule displaying camera housing, green LED, left wing (timer / music) and right wing (equalizer, battery).
3. `IslandExpanded`: Expanded container dropping down from the top screen edge.
4. `IslandHeader`: Segmented navigation control with active status dots and circular traffic close trigger.
5. `IslandActionButton`: Primary, secondary, subtle, and danger pill buttons with loading and shortcut support.
6. `IslandIconButton`: Circular / rounded icon triggers with hover states and accessible labels.
7. `IslandProgressBar`: Reusable progress indicator with custom height, seekable callbacks, and color variants.
8. `IslandTimer`: Focus / Pomodoro timer with tabular digits, progress bar, +1m bump, and quick duration presets.
9. `IslandMusicPlayer`: Media controller with album art, track scrub bar, play/pause, skip, and volume toggles.
10. `IslandBatteryIndicator`: Power diagnostics with battery percentage, fast charging badges, and health condition metrics.
11. `IslandNotification`: Dismissible notification preview banner with category badges and optional quick action buttons.
12. `IslandQuickActions`: Grid of one-tap shortcuts (Focus 25m, Short Break, Desktop Lyrics HUD, Mute).
13. `IslandSettingsPanel`: macOS System Settings grouped cells with authentic sliding toggle switches and display profiles.
14. `IslandContextMenu`: Floating dark popup menu for secondary actions.
15. `IslandTooltip`: Lightweight accessible hover micro-tooltip.
16. `IslandStatusIndicator`: Micro status dot with optional pulse animation.
