import React, { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { MusicState } from "../../types/island";
import { BoppiAvatar } from "../../components/BoppiAvatar";

interface Props {
  music: MusicState;
  onSeekLyric?: (seconds: number) => void;
}

export const LyricsFeature: React.FC<Props> = ({ music, onSeekLyric }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [music.currentLyric, music.progressSeconds]);

  const currentMs = music.progressSeconds * 1000;

  return (
    <div className="feature-pane lyrics-view-v2">
      <div className="lyrics-header-row">
        <span className="lyrics-track-info">
          <BoppiAvatar
            size={16}
            mood={music.isPlaying ? "groove" : "idle"}
            interactive={true}
            bubblePlacement="bottom"
            showBubbleOnPoke={true}
          />
          <span className="lyrics-song-title">{music.title}</span>
          <span className="lyrics-artist-sub">• {music.artist}</span>
        </span>
        <span className="lyrics-sync-badge">
          <Sparkles size={10} /> Live Synced
        </span>
      </div>

      <div className="karaoke-scroll-box" ref={containerRef}>
        {music.lyrics.map((line, index) => {
          const isNext = index < music.lyrics.length - 1 && currentMs < music.lyrics[index + 1].timeMs && currentMs >= line.timeMs;
          const isLastAndActive = index === music.lyrics.length - 1 && currentMs >= line.timeMs;
          const isActive = isNext || isLastAndActive || line.text === music.currentLyric;

          return (
            <div
              key={line.id}
              ref={isActive ? activeLineRef : null}
              className={`karaoke-line ${isActive ? "active" : ""}`}
              onClick={() => onSeekLyric?.(Math.floor(line.timeMs / 1000))}
              title="Click line to jump playback"
            >
              <span className="karaoke-text">{line.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

