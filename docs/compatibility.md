# macOS Hardware & Display Compatibility Guide

## 1. Target Hardware Specifications

### MacBook Pro 14-inch (2021) — M1 Pro / M1 Max
- **Native Resolution**: 3024 × 1964 pixels.
- **Default Logical Points**: 1512 × 982 pt (@2x Retina).
- **Physical Notch Width**: ~210 pt.
- **Top Menu Bar Height**: 34–38 pt.
- **Dynamic Island Alignment**: Flushed horizontally centered at `(1512 - 210) / 2 = 651 pt` from left edge, `y = 0` (top bezel edge). Outward ear cutouts `border-top-left-radius: 12px` and `border-top-right-radius: 12px` fuse into display bezel.

### MacBook Pro 16-inch (2021) — M1 Pro / M1 Max
- **Native Resolution**: 3456 × 2234 pixels.
- **Default Logical Points**: 1728 × 1117 pt (@2x Retina).
- **Physical Notch Width**: ~214 pt.
- **Top Menu Bar Height**: 36–44 pt.
- **Dynamic Island Alignment**: Flushed horizontally centered at `(1728 - 214) / 2 = 757 pt` from left edge, `y = 0`.

### Intel MacBooks & Non-Notch Displays (Fallback Profile)
- **Supported Models**: MacBook Pro 13" (2018–2020), MacBook Air (Intel & M1 2020), iMac, Mac mini.
- **Display Behavior**: Functions as a floating top pill positioned 8px below the menu bar or centered on the active display without notch ears.

---

## 2. Multi-Monitor & External Display Handling

- The application uses `objc2_app_kit::NSScreen::mainScreen()` to detect the active display with user focus.
- When moving between external 4K/5K displays and the built-in Liquid Retina XDR screen, coordinate recalculation adjusts logical point offsets.
- The `corner-lyrics` window is non-stationary and can be dragged to any external monitor or workspace.

---

## 3. macOS Version Compatibility

| OS Version | Compatibility Status | Notes |
|---|---|---|
| macOS 12 (Monterey) | Fully Supported | Initial introduction of physical display notch |
| macOS 13 (Ventura) | Fully Supported | Native AppKit NSWindow level 25 |
| macOS 14 (Sonoma) | Fully Supported | Interactive Desktop Widgets & Space integration |
| macOS 15 (Sequoia) | Fully Supported | Window tiling safe zones respected |

---

## 4. Build & Distribution Instructions

### Development Mode
```bash
npm install
npm run tauri dev
```

### Production Build
```bash
npm run tauri build
```
The output `.app` and `.dmg` will be generated in `src-tauri/target/release/bundle/macos/`.
