import React, { useState, useMemo, useRef, useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { MusicState } from "../types/island";
import { BoppiAvatar } from "./BoppiAvatar";
import { playPopSound, playSwallowSound } from "../utils/audio";

interface Props {
  music: MusicState;
  onTogglePlay?: () => void;
  onOpenIslandLyrics?: () => void;
}

const ROW_HEIGHT = 25;

let cachedMeasureCanvas: HTMLCanvasElement | null = null;
let cachedMeasureCtx: CanvasRenderingContext2D | null = null;

function measureTextWidth(text: string): number {
  if (typeof document === "undefined") return text.length * 9;
  if (!cachedMeasureCanvas) {
    cachedMeasureCanvas = document.createElement("canvas");
    cachedMeasureCtx = cachedMeasureCanvas.getContext("2d");
  }
  if (!cachedMeasureCtx) return text.length * 9;
  cachedMeasureCtx.font = "600 14.5px -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  return cachedMeasureCtx.measureText(text).width;
}

export type LyricAnimStage =
  | "hidden"
  | "jumping-icon"
  | "unfolding"
  | "visible"
  | "collapsing"
  | "swallowing";

export const CornerLyrics: React.FC<Props> = ({ music, onOpenIslandLyrics }) => {
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const isPlaying = Boolean(
    music.isPlaying &&
    music.title &&
    music.title !== "No Media Playing" &&
    music.title !== "Connecting to Media..."
  );

  const [animStage, setAnimStage] = useState<LyricAnimStage>(
    isPlaying ? "visible" : "hidden"
  );
  const prevPlayingRef = useRef<boolean | null>(null);
  const animTimersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = () => {
    animTimersRef.current.forEach(clearTimeout);
    animTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Size window generously and sync initial visibility
  useEffect(() => {
    try {
      const appWindow = getCurrentWebviewWindow();
      appWindow.setSize(new LogicalSize(720, 90));
      if (!isPlaying) {
        appWindow.hide();
      } else {
        appWindow.show();
      }
    } catch {
      // preview fallback
    }
  }, []);

  // Coordinated Staged Jump: Icon jumps out first, then text unfolds smoothly
  useEffect(() => {
    if (prevPlayingRef.current === null) {
      prevPlayingRef.current = isPlaying;
      if (!isPlaying) {
        setAnimStage("hidden");
      } else {
        setAnimStage("visible");
      }
      return;
    }

    if (isPlaying === prevPlayingRef.current) return;
    prevPlayingRef.current = isPlaying;
    clearTimers();

    if (isPlaying) {
      // 1. Immediately position under island and show window
      try {
        invoke("position_lyrics_overlay").catch(() => {});
        const appWindow = getCurrentWebviewWindow();
        appWindow.show();
      } catch {}

      // Stage 1: Cute icon jumps out from Dynamic Island as a bouncy compact bubble (440ms)
      playPopSound();
      setAnimStage("jumping-icon");

      // Stage 2: Once icon lands softly, pill unfolds horizontally and text slides in
      const t1 = setTimeout(() => {
        setAnimStage("unfolding");
      }, 440);

      // Stage 3: Transition to normal visible steady state
      const t2 = setTimeout(() => {
        setAnimStage("visible");
      }, 880);

      animTimersRef.current = [t1, t2];
    } else {
      // Reverse Stage 1: Retract text lyrics into the cute mascot icon (260ms)
      setAnimStage("collapsing");

      // Reverse Stage 2: Mascot icon squats and leaps upward into notch (360ms)
      const t1 = setTimeout(() => {
        playSwallowSound();
        setAnimStage("swallowing");
      }, 260);

      // Reverse Stage 3: Swallowed into notch, hide window
      const t2 = setTimeout(() => {
        setAnimStage("hidden");
        try {
          const appWindow = getCurrentWebviewWindow();
          appWindow.hide();
        } catch {}
      }, 620);

      animTimersRef.current = [t1, t2];
    }
  }, [isPlaying]);

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
    if (isDraggingRef.current) {
      e.stopPropagation();
      return;
    }
    onOpenIslandLyrics?.();
  };

  const hasRealLyrics = Boolean(music.lyrics && music.lyrics.length > 2);

  // Prepare display lyric sequence (real LRC timestamps or synchronized fallbacks)
  const displayLyrics = useMemo(() => {
    if (hasRealLyrics && music.lyrics) {
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
      { id: 3, timeMs: 8000, text: `Album: ${cleanAlbum}` },
      { id: 4, timeMs: 12000, text: music.currentLyric || "Boppi • A little bop above your apps" },
    ];
  }, [hasRealLyrics, music.lyrics, music.title, music.artist, music.album, music.currentLyric]);

  // Compute currently active line index based on playback timestamp
  const currentMs = (music.progressSeconds || 0) * 1000;

  const activeIndex = useMemo(() => {
    if (displayLyrics.length === 0) return 0;

    if (hasRealLyrics) {
      let idx = 0;
      for (let i = 0; i < displayLyrics.length; i++) {
        if (currentMs >= displayLyrics[i].timeMs) {
          idx = i;
        } else {
          break;
        }
      }
      return idx;
    }

    // For 4-line fallback cycle, smoothly rotate every 4 seconds
    const cycle = Math.floor((music.progressSeconds || 0) / 4) % displayLyrics.length;
    return cycle;
  }, [displayLyrics, currentMs, music.progressSeconds, hasRealLyrics]);

  const activeText = displayLyrics[activeIndex]?.text || "♪ Instrumental ♪";

  // Measure pixel-accurate width for dynamic pill animation
  const textWidth = useMemo(() => measureTextWidth(activeText), [activeText]);
  const MAX_CARD_WIDTH = 650;
  const MIN_CARD_WIDTH = 150;
  const PADDING_AND_MASCOT = 68;

  const cardWidth = useMemo(() => {
    return Math.max(
      MIN_CARD_WIDTH,
      Math.min(MAX_CARD_WIDTH, Math.ceil(textWidth + PADDING_AND_MASCOT))
    );
  }, [textWidth]);

  const isOverflowing = textWidth > MAX_CARD_WIDTH - PADDING_AND_MASCOT;
  const overflowDistance = isOverflowing
    ? Math.ceil(textWidth - (MAX_CARD_WIDTH - PADDING_AND_MASCOT) + 16)
    : 0;

  if (animStage === "hidden") {
    return null;
  }

  const isIconMode =
    animStage === "jumping-icon" ||
    animStage === "collapsing" ||
    animStage === "swallowing";

  const pillWidth = isIconMode ? 38 : cardWidth;

  let animClass = "";
  if (animStage === "jumping-icon") {
    animClass = "anim-icon-jumping-out is-icon-mode";
  } else if (animStage === "unfolding") {
    animClass = "is-unfolding";
  } else if (animStage === "visible") {
    animClass = "is-visible";
  } else if (animStage === "collapsing") {
    animClass = "is-collapsing is-icon-mode";
  } else if (animStage === "swallowing") {
    animClass = "anim-icon-jumping-in is-icon-mode";
  }

  const mascotMood =
    animStage === "jumping-icon"
      ? "surprised"
      : animStage === "swallowing"
      ? "wink"
      : music.isPlaying
      ? "groove"
      : "idle";

  return (
    <div className="corner-lyrics-container" data-tauri-drag-region>
      <div
        className={`floating-mp3-lyrics is-flexible ${animClass}`}
        style={{ width: `${pillWidth}px` }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        data-tauri-drag-region
        title="Tahan & Drag teks untuk memindahkan • Ukuran adaptif mengikuti lirik"
      >
        {/* Playful Boppi Mascot Grooving Next to Lyrics */}
        <div
          className="corner-lyrics-mascot-slot"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <BoppiAvatar
            size={22}
            mood={mascotMood}
            interactive={true}
            bubblePlacement="top"
            showBubbleOnPoke={false}
          />
        </div>

        <div
          className={`mp3-lyrics-viewport ${isOverflowing ? "has-overflow" : ""}`}
          data-tauri-drag-region
        >
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
                  <span
                    className={`mp3-lyric-text ${isActive && isOverflowing ? "is-scrolling" : ""}`}
                    data-tauri-drag-region
                    title={lineText}
                    style={
                      isActive && isOverflowing
                        ? ({
                            "--marquee-shift": `-${overflowDistance}px`,
                            animationDuration: `${Math.max(4.5, overflowDistance / 28)}s`,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
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
