import React, { useState } from "react";
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";
import { MusicState } from "../../types/island";

interface Props {
  music: MusicState;
  onTogglePlay: () => void;
}

export const MusicFeature: React.FC<Props> = ({ music, onTogglePlay }) => {
  const [volumeMuted, setVolumeMuted] = useState(false);
  const pct = Math.min(100, Math.round((music.progressSeconds / music.durationSeconds) * 100));

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="feature-pane music-view-v2">
      {/* Album Artwork with subtle pulse when playing */}
      <div className={`music-artwork-v2 ${music.isPlaying ? "is-playing" : ""}`}>
        <Music size={22} color="#ffffff" />
        {music.isPlaying && <div className="artwork-playing-glow" />}
      </div>

      {/* Meta & Interactive Track Seek Bar */}
      <div className="music-center-col">
        <div className="music-meta-top">
          <div className="music-title-text" title={music.title}>{music.title}</div>
          <div className="music-artist-text">{music.artist}</div>
        </div>

        {/* Progress Bar with Current and Total Timestamps */}
        <div className="music-scrub-container">
          <span className="scrub-time">{formatSeconds(music.progressSeconds)}</span>
          <div className="music-track-bar" title="Track playback progress">
            <div className="music-bar-fill" style={{ width: `${pct}%` }} />
            <div className="music-scrub-thumb" style={{ left: `${pct}%` }} />
          </div>
          <span className="scrub-time">{formatSeconds(music.durationSeconds)}</span>
        </div>
      </div>

      {/* Playback Controls & Mute button */}
      <div className="music-action-col">
        <div className="music-transport-group">
          <button className="transport-btn" title="Previous Track">
            <SkipBack size={13} fill="currentColor" />
          </button>
          
          <button
            className="transport-play-btn"
            onClick={onTogglePlay}
            title={music.isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {music.isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          </button>

          <button className="transport-btn" title="Next Track">
            <SkipForward size={13} fill="currentColor" />
          </button>
        </div>

        <button
          type="button"
          className="volume-toggle-btn"
          onClick={() => setVolumeMuted(!volumeMuted)}
          title={volumeMuted ? "Unmute" : "Mute audio"}
        >
          {volumeMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
      </div>
    </div>
  );
};

