'use client';
import { extractYouTubeVideoId } from '../lib/youtube';
import { useState } from 'react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: (playing: boolean) => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onChangeVideo: (videoId: string) => void;
  disabled: boolean;
  onRequestControl?: () => void;
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PlaybackControls({
  isPlaying, onPlayPause, currentTime, duration, onSeek, onChangeVideo, disabled, onRequestControl
}: PlaybackControlsProps) {
  const [url, setUrl] = useState('');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeVideoId(url);
    if (id) {
      onChangeVideo(id);
      setUrl('');
    }
  };

  return (
    <div className={`p-6 bg-transparent border-t border-[var(--border)] flex flex-col gap-4 ${disabled ? 'opacity-80' : ''}`}>
      <div className="flex items-center gap-6">
        <button
          disabled={disabled}
          onClick={() => onPlayPause(!isPlaying)}
          className={`w-14 h-14 flex items-center justify-center rounded-full bg-[var(--accent)] text-white font-bold text-2xl hover:scale-105 active:scale-95 transition-transform disabled:bg-gray-400 disabled:transform-none shadow-sm`}
        >
          {isPlaying ? 'II' : '▶'}
        </button>

        <div className="flex-1 flex items-center gap-4 bg-[var(--bg-color)] border border-[var(--border)] rounded-full px-4 py-2 shadow-inner">
          <span className="font-mono text-sm w-12 text-right font-bold">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            disabled={disabled}
            className="flex-1 h-3 bg-[var(--border)] rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-[var(--accent)]"
          />
          <span className="font-mono text-sm w-12 font-bold">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 justify-between mt-2">
        <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-3 max-w-lg">
          <input
            type="text"
            placeholder="Paste YouTube URL..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            disabled={disabled}
            className="flex-1 bg-[var(--bg-color)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-4 py-2 font-bold text-[var(--text-primary)] focus:outline-none disabled:opacity-50 shadow-inner"
          />
          <button
            type="submit"
            disabled={disabled || !url.trim()}
            className="px-6 py-2 bg-[var(--droplet-4)] text-[var(--bg-color)] font-bold rounded-xl hover:-translate-y-1 active:translate-y-1 transition-transform shadow-sm disabled:opacity-50 disabled:transform-none"
          >
            Load
          </button>
        </form>

        <div className="flex items-center gap-2">
          {disabled && onRequestControl && (
            <button
              onClick={onRequestControl}
              className="px-6 py-2 bg-[var(--droplet-2)] text-[var(--bg-color)] font-bold rounded-xl hover:-translate-y-1 active:translate-y-1 transition-transform shadow-sm"
            >
              Request Remote
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
