#[derive(Debug, Clone, Copy)]
pub struct ScreenDimensions {
    pub width: f64,
    pub height: f64,
    pub scale_factor: f64,
    pub menu_bar_height: f64,
}

impl Default for ScreenDimensions {
    fn default() -> Self {
        Self {
            width: 1440.0,
            height: 900.0,
            scale_factor: 2.0,
            menu_bar_height: 24.0,
        }
    }
}

pub struct ScreenManager;

impl ScreenManager {
    #[cfg(target_os = "macos")]
    pub fn get_primary_screen() -> ScreenDimensions {
        use objc2_app_kit::NSScreen;
        use objc2_foundation::MainThreadMarker;

        if let Some(mtm) = MainThreadMarker::new() {
            if let Some(main_screen) = NSScreen::mainScreen(mtm) {
                let frame = main_screen.frame();
                let visible_frame = main_screen.visibleFrame();
                let scale = main_screen.backingScaleFactor();

                let menu_bar =
                    frame.size.height - (visible_frame.origin.y + visible_frame.size.height);

                return ScreenDimensions {
                    width: frame.size.width,
                    height: frame.size.height,
                    scale_factor: scale,
                    menu_bar_height: if menu_bar > 0.0 { menu_bar } else { 24.0 },
                };
            }
        }

        ScreenDimensions::default()
    }

    #[cfg(not(target_os = "macos"))]
    pub fn get_primary_screen() -> ScreenDimensions {
        ScreenDimensions::default()
    }
}
