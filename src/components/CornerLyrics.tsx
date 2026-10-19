import React, { useMemo, useRef, useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { MusicState } from "../types/island";
import { BoppiAvatar } from "./BoppiAvatar";

interface Props {
  music: MusicState;
  onTogglePlay?: () => void;
  onOpenIslandLyrics?: () => void;
}

const ROW_HEIGHT = 25;

export const CornerLyrics: React.FC<Props> = ({ music, onOpenIslandLyrics }) => {
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Ensure window is sized generously so long lyrics are never truncated
  useEffect(() => {
    try {
      const appWindow = getCurrentWebviewWindow();
      appWindow.setSize(new LogicalSize(700, 60));
    } catch {
      // preview fallback
    }
  }, []);

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = false;
      startPosRef.current = { x: e.screenX, y: e.screenY };
      try {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.startDragging();
      } catch {
        // Fallback for browser preview
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const dx = Math.abs(e.screenX - startPosRef.current.x);
    const dy = Math.abs(e.screenY - startPosRef.current.y);
    if (dx > 4 || dy > 4) {
      isDraggingRef.current = true;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only expand if it was a real click, not the end of a drag movement
    if (isDraggingRef.current) {
      e.stopPropagation();
      return;
    }
    onOpenIslandLyrics?.();
  };

  // Prepare display lyric sequence (real LRC timestamps or synchronized fallbacks)
  const displayLyrics = useMemo(() => {
    if (music.lyrics && music.lyrics.length > 0) {
      return music.lyrics;
    }

    const cleanTitle =
      music.title && music.title !== "Connecting to Media..."
        ? music.title
        : "Play music in Spotify or Apple Music";
    const cleanArtist =
      music.artist && music.artist !== "Spotify / Apple Music"
        ? music.artist
        : "Boppi Mascot";
    const cleanAlbum = music.album || "macOS Media";

    return [
      { id: 1, timeMs: 0, text: `♪ ${cleanTitle}` },
      { id: 2, timeMs: 4000, text: cleanArtist },
      { id: 3, timeMs: 8000, text: cleanAlbum },
      { id: 4, timeMs: 12000, text: music.currentLyric || "Boppi • A little bop above your apps" },
    ];
  }, [music.lyrics, music.title, music.artist, music.album, music.currentLyric]);

  // Compute currently active line index based on playback timestamp
  const currentMs = (music.progressSeconds || 0) * 1000;

  const activeIndex = useMemo(() => {
    if (displayLyrics.length === 0) return 0;

    let idx = 0;
    for (let i = 0; i < displayLyrics.length; i++) {
      if (currentMs >= displayLyrics[i].timeMs) {
        idx = i;
      } else {
        break;
      }
    }

    // If using fallback 4-line loop, cycle smoothly based on elapsed seconds
    if (displayLyrics.length <= 4 && (!music.lyrics || music.lyrics.length === 0)) {
      const cycle = Math.floor((music.progressSeconds || 0) / 4) % displayLyrics.length;
      return cycle;
    }

    return idx;
  }, [displayLyrics, currentMs, music.progressSeconds, music.lyrics]);

  return (
    <div className="corner-lyrics-container" data-tauri-drag-region>
      <div
        className="floating-mp3-lyrics"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        data-tauri-drag-region
        title="Tahan & Drag teks untuk memindahkan ke mana saja • Klik untuk buka Boppi"
      >
        {/* Playful Boppi Mascot Grooving Next to Lyrics */}
        <div
          className="corner-lyrics-mascot-slot"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <BoppiAvatar
            size={22}
            mood={music.isPlaying ? "groove" : "idle"}
            interactive={true}
            bubblePlacement="top"
            showBubbleOnPoke={true}
          />
        </div>

        <div className="mp3-lyrics-viewport" data-tauri-drag-region>
          <div
            className="mp3-lyrics-track"
            data-tauri-drag-region
            style={{
              transform: `translateY(-${activeIndex * ROW_HEIGHT}px)`,
            }}
          >
            {displayLyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isNext = idx === activeIndex + 1;
              const isPast = idx < activeIndex;
              const lineText =
                line.text && line.text.trim().length > 0 ? line.text : "♪ Instrumental ♪";

              return (
                <div
                  key={line.id || idx}
                  data-tauri-drag-region
                  className={`mp3-lyric-row ${
                    isActive ? "active" : isNext ? "next" : isPast ? "faded-past" : "faded"
                  }`}
                >
                  <span className="mp3-lyric-text" data-tauri-drag-region title={lineText}>
                    {lineText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
