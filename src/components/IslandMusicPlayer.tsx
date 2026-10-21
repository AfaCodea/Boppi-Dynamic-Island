import React, { useState } from "react";
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";
import { MusicState } from "../types/island";
import { IslandProgressBar } from "./IslandProgressBar";
import { IslandIconButton } from "./IslandIconButton";

export interface IslandMusicPlayerProps {
  /** Playback and metadata state */
  music: MusicState;
  /** Play/Pause toggle callback */
  onTogglePlay: () => void;
  /** Seek callback */
  onSeek?: (seconds: number) => void;
  /** Skip next */
  onNext?: () => void;
  /** Skip previous */
  onPrev?: () => void;
}

/**
 * IslandMusicPlayer: Media playback controller with scrub track and artwork.
 */
export const IslandMusicPlayer: React.FC<IslandMusicPlayerProps> = ({
  music,
  onTogglePlay,
  onSeek,
  onNext,
  onPrev,
}) => {
  const [muted, setMuted] = useState(false);
  const progressPct =
    music.durationSeconds > 0
      ? Math.min(100, Math.round((music.progressSeconds / music.durationSeconds) * 100))
      : 0;

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSeekPercentage = (pct: number) => {
    if (!onSeek) return;
    const targetSeconds = Math.round((pct / 100) * music.durationSeconds);
    onSeek(targetSeconds);
  };

  return (
    <div className="feature-pane island-music-pane" role="region" aria-label="Music Player">
      {/* Artwork Thumbnail */}
      <div className={`music-artwork-v2 ${music.isPlaying ? "is-playing" : ""}`}>
        <Music size={22} color="currentColor" aria-hidden="true" />
      </div>

      {/* Track Info & Interactive Progress Bar */}
      <div className="music-center-col">
        <div className="music-meta-top">
          <div className="music-title-text" title={music.title}>
            {music.title}
          </div>
          <div className="music-artist-text">{music.artist}</div>
        </div>

        <div className="music-scrub-container">
          <span className="scrub-time">{formatSeconds(music.progressSeconds)}</span>
          <IslandProgressBar
            value={progressPct}
            variant="white"
            height={4}
            onSeek={handleSeekPercentage}
            showThumb
            label="Playback position"
          />
          <span className="scrub-time">{formatSeconds(music.durationSeconds)}</span>
        </div>
      </div>

      {/* Media Controls */}
      <div className="music-action-col">
        <div className="music-transport-group">
          <IslandIconButton
            icon={<SkipBack size={12} fill="currentColor" />}
            title="Previous track"
            onClick={onPrev}
            size={24}
          />
          <button
            type="button"
            className="transport-play-btn"
            onClick={onTogglePlay}
            title={music.isPlaying ? "Pause (Space)" : "Play (Space)"}
            aria-label={music.isPlaying ? "Pause" : "Play"}
          >
            {music.isPlaying ? (
              <Pause size={13} fill="currentColor" />
            ) : (
              <Play size={13} fill="currentColor" />
            )}
          </button>
          <IslandIconButton
            icon={<SkipForward size={12} fill="currentColor" />}
            title="Next track"
            onClick={onNext}
            size={24}
          />
        </div>

        <IslandIconButton
          icon={muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          title={muted ? "Unmute" : "Mute audio"}
          onClick={() => setMuted(!muted)}
          size={20}
          className="volume-icon-btn"
        />
      </div>
    </div>
  );
};
