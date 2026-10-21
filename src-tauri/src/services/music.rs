use crate::events::emit_music_changed;
use crate::state::{AppState, LyricLine, MusicState};
use std::process::Command;
use std::time::Duration;
use tauri::AppHandle;
use tokio::time::sleep;

pub struct MusicService;

impl MusicService {
    /// Read live now-playing metadata directly from Spotify or Apple Music on macOS
    pub fn poll_active_player() -> Option<(String, MusicState)> {
        #[cfg(target_os = "macos")]
        {
            let script = r#"
set isSpotifyRunning to false
if application "Spotify" is running then set isSpotifyRunning to true
set isMusicRunning to false
if application "Music" is running then set isMusicRunning to true

set spotifyState to "stopped"
if isSpotifyRunning then
    try
        tell application "Spotify" to set spotifyState to (player state as string)
    end try
end if

set musicState to "stopped"
if isMusicRunning then
    try
        tell application "Music" to set musicState to (player state as string)
    end try
end if

if spotifyState is "playing" then
    tell application "Spotify"
        set cName to name of current track
        set cArtist to artist of current track
        set cAlbum to album of current track
        set cPos to player position
        set cDur to (duration of current track) / 1000
        return "spotify|||" & spotifyState & "|||" & cName & "|||" & cArtist & "|||" & cAlbum & "|||" & (cPos as integer) & "|||" & (cDur as integer)
    end tell
else if musicState is "playing" then
    tell application "Music"
        set cName to name of current track
        set cArtist to artist of current track
        set cAlbum to album of current track
        set cPos to player position
        set cDur to duration of current track
        return "music|||" & musicState & "|||" & cName & "|||" & cArtist & "|||" & cAlbum & "|||" & (cPos as integer) & "|||" & (cDur as integer)
    end tell
else if isSpotifyRunning and spotifyState is not "stopped" then
    tell application "Spotify"
        set cName to name of current track
        set cArtist to artist of current track
        set cAlbum to album of current track
        set cPos to player position
        set cDur to (duration of current track) / 1000
        return "spotify|||" & spotifyState & "|||" & cName & "|||" & cArtist & "|||" & cAlbum & "|||" & (cPos as integer) & "|||" & (cDur as integer)
    end tell
else if isMusicRunning and musicState is not "stopped" then
    tell application "Music"
        set cName to name of current track
        set cArtist to artist of current track
        set cAlbum to album of current track
        set cPos to player position
        set cDur to duration of current track
        return "music|||" & musicState & "|||" & cName & "|||" & cArtist & "|||" & cAlbum & "|||" & (cPos as integer) & "|||" & (cDur as integer)
    end tell
end if

return "none|||stopped||||||||||||0|||0"
"#;

            let output = Command::new("osascript").arg("-e").arg(script).output().ok()?;
            if !output.status.success() {
                return None;
            }

            let result = String::from_utf8_lossy(&output.stdout);
            let trimmed = result.trim();
            let parts: Vec<&str> = trimmed.split("|||").collect();
            if parts.len() < 7 {
                return None;
            }

            let source = parts[0].to_string();
            let player_state = parts[1];
            let title = parts[2].to_string();
            let artist = parts[3].to_string();
            let album = parts[4].to_string();
            let pos: u64 = parts[5].parse().unwrap_or(0);
            let dur: u64 = parts[6].parse().unwrap_or(0);

            if source == "none" || title.is_empty() {
                return None;
            }

            let is_playing = player_state == "playing";

            let music_state = MusicState {
                title,
                artist,
                album,
                is_playing,
                progress_seconds: pos,
                duration_seconds: if dur > 0 { dur } else { 180 },
                current_lyric: String::new(),
                lyrics: Vec::new(),
            };

            return Some((source, music_state));
        }

        #[cfg(not(target_os = "macos"))]
        None
    }

    pub fn get_current_track(state: &AppState) -> MusicState {
        // Query live system player immediately if possible
        if let Some((_, live_track)) = Self::poll_active_player() {
            let mut music = state
                .0
                .music
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());
            music.title = live_track.title;
            music.artist = live_track.artist;
            music.album = live_track.album;
            music.is_playing = live_track.is_playing;
            music.progress_seconds = live_track.progress_seconds;
            music.duration_seconds = live_track.duration_seconds;
            return music.clone();
        }

        let music = state
            .0
            .music
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        music.clone()
    }

    /// Background service loop syncing live Spotify & Apple Music state into Tauri events
    pub fn start_playback_loop(app: AppHandle, state: AppState) {
        tauri::async_runtime::spawn(async move {
            let mut last_title = String::new();
            let mut last_is_playing = false;
            let mut last_pos = 0u64;
            let mut is_first_run = true;

            loop {
                sleep(Duration::from_millis(1000)).await;

                // 1. Check real active player
                let live_result = tokio::task::spawn_blocking(Self::poll_active_player)
                    .await
                    .unwrap_or(None);

                let updated_music = {
                    let mut music = state
                        .0
                        .music
                        .lock()
                        .unwrap_or_else(|poisoned| poisoned.into_inner());

                    if let Some((_, live)) = live_result {
                        let track_changed = live.title != last_title || live.artist != music.artist;

                        music.title = live.title;
                        music.artist = live.artist;
                        music.album = live.album;
                        music.is_playing = live.is_playing;
                        music.duration_seconds = live.duration_seconds;
                        music.progress_seconds = live.progress_seconds;

                        if track_changed {
                            // Synthesize or adapt lyrics for display
                            music.current_lyric = format!("♪ Playing: {} by {}", music.title, music.artist);
                            music.lyrics = vec![
                                LyricLine {
                                    id: 1,
                                    time_ms: 0,
                                    text: format!("{} - {}", music.title, music.artist),
                                },
                                LyricLine {
                                    id: 2,
                                    time_ms: 5000,
                                    text: format!("Album: {}", music.album),
                                },
                            ];

                            // Connected notification only when track genuinely changes, never on first startup
                            if !is_first_run && !music.title.is_empty() && music.title != "Connecting to Media..." {
                                crate::events::emit_notification(
                                    &app,
                                    &crate::events::NotificationPayload {
                                        id: format!("track-{}", music.title),
                                        title: "Now Playing 🎵".to_string(),
                                        message: format!("{} • {}", music.title, music.artist),
                                        category: Some("music".to_string()),
                                        time_label: Some("Now".to_string()),
                                        action_label: Some("Buka Lirik".to_string()),
                                    },
                                );
                            }
                        }

                        let should_emit = track_changed
                            || live.is_playing != last_is_playing
                            || live.progress_seconds != last_pos;

                        last_title = music.title.clone();
                        last_is_playing = music.is_playing;
                        last_pos = music.progress_seconds;
                        is_first_run = false;

                        if should_emit {
                            Some(music.clone())
                        } else {
                            None
                        }
                    } else {
                        is_first_run = false;
                        // Fallback: If no real app running, simulate tick if user started play
                        if music.is_playing && music.duration_seconds > 0 {
                            music.progress_seconds =
                                (music.progress_seconds + 1) % music.duration_seconds;
                            Some(music.clone())
                        } else {
                            None
                        }
                    }
                };

                if let Some(m) = updated_music {
                    emit_music_changed(&app, &m);
                }
            }
        });
    }

    /// Toggle playback on real active media app
    pub fn toggle_playback(_app: &AppHandle, state: &AppState) -> MusicState {
        #[cfg(target_os = "macos")]
        {
            let script = r#"
set isSpotifyRunning to false
if application "Spotify" is running then set isSpotifyRunning to true
set isMusicRunning to false
if application "Music" is running then set isMusicRunning to true

if isSpotifyRunning then
    tell application "Spotify" to playpause
else if isMusicRunning then
    tell application "Music" to playpause
end if
"#;
            let _ = Command::new("osascript").arg("-e").arg(script).output();
        }

        // Read updated track status
        Self::get_current_track(state)
    }

    /// Skip to next track on real media app
    pub fn next_track(_app: &AppHandle, state: &AppState) -> MusicState {
        #[cfg(target_os = "macos")]
        {
            let script = r#"
set isSpotifyRunning to false
if application "Spotify" is running then set isSpotifyRunning to true
set isMusicRunning to false
if application "Music" is running then set isMusicRunning to true

if isSpotifyRunning then
    tell application "Spotify" to next track
else if isMusicRunning then
    tell application "Music" to next track
end if
"#;
            let _ = Command::new("osascript").arg("-e").arg(script).output();
        }

        Self::get_current_track(state)
    }

    /// Skip to previous track on real media app
    pub fn prev_track(_app: &AppHandle, state: &AppState) -> MusicState {
        #[cfg(target_os = "macos")]
        {
            let script = r#"
set isSpotifyRunning to false
if application "Spotify" is running then set isSpotifyRunning to true
set isMusicRunning to false
if application "Music" is running then set isMusicRunning to true

if isSpotifyRunning then
    tell application "Spotify" to previous track
else if isMusicRunning then
    tell application "Music" to previous track
end if
"#;
            let _ = Command::new("osascript").arg("-e").arg(script).output();
        }

        Self::get_current_track(state)
    }

    /// Seek playback position on real media app
    pub fn seek_playback(_app: &AppHandle, state: &AppState, seconds: u64) -> MusicState {
        #[cfg(target_os = "macos")]
        {
            let script = format!(
                r#"
set isSpotifyRunning to false
if application "Spotify" is running then set isSpotifyRunning to true
set isMusicRunning to false
if application "Music" is running then set isMusicRunning to true

if isSpotifyRunning then
    tell application "Spotify" to set player position to {}
else if isMusicRunning then
    tell application "Music" to set player position to {}
end if
"#,
                seconds, seconds
            );
            let _ = Command::new("osascript").arg("-e").arg(script).output();
        }

        Self::get_current_track(state)
    }
}
