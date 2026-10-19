# macOS Dynamic Island — Technical Architecture & Implementation Guide

Target Architecture: macOS M1 Pro / M1 Max (MacBook Pro 14" & 16", 2021) with backward compatibility for Intel MacBooks.

---

## 1. System Overview

```
┌────────────────────────────────────────────────────────┐
│ Frontend: React 18 + TypeScript (Strict) + Vite        │
│ 16 Custom Components (IslandShell, Compact, Expanded)  │
└───────────────────────────┬────────────────────────────┘
                            │ Tauri IPC (JSON Payloads)
               ┌────────────┴────────────┐
               │                         │
          Commands                    Events
      (Frontend → Rust)          (Rust → Frontend)
               │                         │
┌──────────────┴─────────────────────────┴───────────────┐
│ Rust Application Core (`src-tauri/`)                   │
│ - Monotonic Timer (std::time::Instant)                 │
│ - Audio & Battery Telemetry Services                   │
│ - State Management (Arc<Mutex<AppState>>)              │
│ - Tracing Diagnostics & structured thiserror Errors   │
└───────────────────────────┬────────────────────────────┘
                            │ Safe FFI via objc2
┌───────────────────────────┴────────────────────────────┐
│ Native macOS AppKit Bridge (`native/macos/`)           │
│ - NSWindow Configuration (Level 25: StatusWindow)      │
│ - NSWindowCollectionBehavior (CanJoinAllSpaces)        │
│ - NSScreen Geometry & Physical Notch Alignment         │
└────────────────────────────────────────────────────────┘
```

---

## 2. Native macOS Overlay Implementation (`src-tauri/src/native/macos/`)

### NSWindow Properties
- **Window Level**: Configured to `NSStatusWindowLevel` (level 25) so the island stays positioned at the top menu bar level without interfering with full screen transitions.
- **Collection Behavior**:
  - `NSWindowCollectionBehaviorCanJoinAllSpaces (1 << 0)`
  - `NSWindowCollectionBehaviorStationary (1 << 4)` (for fixed island notch anchor)
  - `NSWindowCollectionBehaviorIgnoresCycle (1 << 6)`
  - For `corner-lyrics`, `Stationary` is disabled and `setMovableByWindowBackground(true)` is activated to enable free window dragging anywhere across workspaces.
- **Surface Transparency**: `NSColor::clearColor()` background and `isOpaque = false`. Window shadows are disabled (`setHasShadow(false)`) to prevent artificial gray box outlines on transparent web views.

### Screen Geometry & Notch Anchor Calculation
```rust
// Centering on primary screen top bezel
let screen_frame = screen.frame();
let win_w = window_frame.size.width;
let win_h = window_frame.size.height;

let x = screen_frame.origin.x + (screen_frame.size.width - win_w) / 2.0;
let y = screen_frame.origin.y + screen_frame.size.height - win_h;
```

---

## 3. IPC Command & Event Contracts

### Commands (Frontend → Rust)
| Command | Arguments | Description |
|---|---|---|
| `expand_island` | `feature?: string` | Expand island to dropdown state |
| `collapse_island` | None | Collapse island back to notch capsule |
| `start_timer` | `seconds: u64, label?: string` | Initiate monotonic countdown session |
| `pause_timer` | None | Pause countdown |
| `stop_timer` | None | Reset countdown |
| `toggle_music` | None | Play/Pause audio playback |
| `get_settings` | None | Retrieve user preferences |
| `update_settings` | `Partial<AppSettings>` | Persist settings modifications |

### Events (Rust → Frontend)
| Event Name | Payload | Frequency |
|---|---|---|
| `timer-tick` | `{ remainingSeconds, running }` | 1 Hz during active timer |
| `music-changed` | `MusicState` | On track switch or playback status change |
| `battery-updated` | `BatteryState` | Polled periodically or on power change |
| `display-changed` | `ScreenDimensions` | On monitor resolution/display hotplug |

---

## 4. Keyboard Shortcuts

- `⌥ ␣` (Option + Space): Toggle Island Expansion.
- `Escape`: Collapse Island from expanded mode.
- `⌘ 1` to `⌘ 5`: Switch directly between Timer, Music, Lyrics, Battery, and Settings.
- `Space`: Play/Pause music when focused.

---

## 5. Verification & Testing Checklist

- [x] TypeScript builds strictly with 0 errors (`npm run build`).
- [x] All 16 required custom components implemented independently in `src/components/`.
- [x] Zero artificial glass/shadows on island shell (`box-shadow: none`, `backdrop-filter` removed).
- [x] Center camera housing features sapphire lens and green FaceTime LED indicator.
- [x] Outward curved notch ears (`::before`, `::after`) blend seamlessly with top bezel.
- [x] Monotonic timer accurate without UI throttle drift.
- [x] Floating corner lyrics pill draggable across the entire desktop.
- [x] Reduced motion preference respected via CSS media query.
