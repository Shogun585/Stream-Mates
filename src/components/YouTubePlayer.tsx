'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import { RoomState } from '../types/socket';
import { extractYouTubeVideoId } from '../lib/youtube';

interface YouTubePlayerProps {
  videoId: string;
  roomState: RoomState | null;
  disabled: boolean;
  onEmit: (event: string, data: any) => void;
  onTimeUpdate: (time: number, duration: number) => void;
  
  // integrated controls props
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: (playing: boolean) => void;
  onSeek: (time: number) => void;
  onChangeVideo: (videoId: string) => void;
  onRequestControl?: () => void;
  isSidebarOpen?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function YouTubePlayer({ 
  videoId, roomState, disabled, onEmit, onTimeUpdate,
  isPlaying, currentTime, duration, onPlayPause, onSeek, onChangeVideo, onRequestControl, isSidebarOpen
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedVideoId = useRef('');
  
  const [showControls, setShowControls] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [url, setUrl] = useState('');
  
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else if (window.YT.Player) {
      initPlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (syncInterval.current) clearInterval(syncInterval.current);
    };
  }, []);

  const initPlayer = () => {
    if (!containerRef.current || playerRef.current) return;
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId || 'KHLNSxe5Y8A', // Fallback prevents YT API crash
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: () => {
          setIsReady(true);
          if (playerRef.current) playerRef.current.setVolume(volume);
        },
        onStateChange: () => {},
      }
    });
  };

  useEffect(() => {
    if (!isReady || !playerRef.current || !roomState) return;
    const player = playerRef.current;

    if (roomState.videoId && roomState.videoId !== lastSyncedVideoId.current) {
      lastSyncedVideoId.current = roomState.videoId;
      if (roomState.playState === 'playing') {
        player.loadVideoById(roomState.videoId, roomState.currentTime);
      } else {
        player.cueVideoById(roomState.videoId, roomState.currentTime);
      }
      return;
    }

    const currentT = player.getCurrentTime?.() || 0;
    const currentState = player.getPlayerState?.();
    const isPlayerPlaying = currentState === 1;

    const timeSinceUpdate = (Date.now() - (roomState.localUpdatedAt || Date.now())) / 1000;
    const expectedTime = roomState.playState === 'playing' 
      ? roomState.currentTime + timeSinceUpdate 
      : roomState.currentTime;

    let didSeek = false;
    if (Math.abs(currentT - expectedTime) > 1.5) {
      player.seekTo(expectedTime, true);
      didSeek = true;
    }

    const shouldPlay = roomState.playState === 'playing';
    if (shouldPlay && !isPlayerPlaying) {
      player.playVideo();
    } else if (!shouldPlay && (isPlayerPlaying || didSeek)) {
      player.pauseVideo();
    }
  }, [roomState, isReady]);

  useEffect(() => {
    if (isReady && playerRef.current) {
      syncInterval.current = setInterval(() => {
        const player = playerRef.current;
        if (player?.getCurrentTime) {
          const current = player.getCurrentTime();
          onTimeUpdate(current, player.getDuration() || 0);

          if (roomState && roomState.playState === 'playing') {
            const timeSinceUpdate = (Date.now() - (roomState.localUpdatedAt || Date.now())) / 1000;
            const expectedTime = roomState.currentTime + timeSinceUpdate;
            
            if (player.getPlayerState() === 1 && Math.abs(current - expectedTime) > 2.0) {
              player.seekTo(expectedTime, true);
            }
          }
        }
      }, 500);
    }
    return () => {
      if (syncInterval.current) clearInterval(syncInterval.current);
    };
  }, [isReady, roomState]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeVideoId(url);
    if (id) {
      onChangeVideo(id);
      setUrl('');
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
      if (isMuted && newVol > 0) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        return;
      }
      
      const key = e.key;
      
      switch (key) {
        case 'ArrowLeft':
        case 'j':
        case 'J':
          if (!disabled) onSeek(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
        case 'l':
        case 'L':
          if (!disabled) onSeek(Math.min(duration, currentTime + 10));
          break;
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault(); // prevent page scroll on space
          if (!disabled) onPlayPause(!isPlaying);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(100, volume + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 10));
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, isPlaying, disabled, volume, onPlayPause, onSeek, toggleFullscreen, toggleMute]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-black relative overflow-hidden flex flex-col group">
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none"></div>
      
      {/* Clickable overlay to toggle controls */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer" 
        onClick={() => setShowControls(!showControls)}
      ></div>

      {/* Integrated Controls (Glide up from bottom) */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 bg-[var(--glass-bg)] md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-t border-[var(--glass-border)] md:border-none p-3 md:px-6 md:pt-6 md:pb-2 flex flex-col gap-4 shadow-2xl md:shadow-none transition-transform duration-500 ease-[cubic-bezier(0.1,0.8,0.2,1)] ${showControls ? 'translate-y-0' : 'translate-y-full'} ${disabled ? 'opacity-90' : ''}`}
        onClick={(e) => e.stopPropagation()} // Prevent toggling when interacting with controls
      >
        <div className={`flex items-center justify-center md:justify-start gap-3 md:gap-6 ${isSidebarOpen ? 'md:justify-between' : ''}`}>
          <div className="flex items-center gap-2">
            <button
              disabled={disabled}
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-[var(--bg-color)] border border-[var(--border)] font-bold hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:transform-none shadow-sm text-[var(--text-primary)]"
            >
              <RotateCcw size={20} />
            </button>
            <button
              disabled={disabled}
              onClick={() => onPlayPause(!isPlaying)}
              className="w-16 h-8 md:w-24 md:h-12 flex items-center justify-center rounded-full bg-[var(--accent)] text-white font-bold hover:scale-105 active:scale-95 transition-transform disabled:bg-gray-400 disabled:transform-none shadow-sm"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            <button
              disabled={disabled}
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-[var(--bg-color)] border border-[var(--border)] font-bold hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:transform-none shadow-sm text-[var(--text-primary)]"
            >
              <RotateCw size={20} />
            </button>
          </div>

          <div className="hidden md:flex flex-1 items-center gap-4 bg-[var(--bg-color)] border border-[var(--border)] rounded-full px-4 py-2 shadow-inner">
            <span className="font-mono text-sm w-12 text-right font-bold text-[var(--text-primary)]">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              disabled={disabled}
              className="flex-1 h-3 bg-[var(--border)] rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-[var(--accent)]"
            />
            <span className="font-mono text-sm w-12 font-bold text-[var(--text-primary)]">{formatTime(duration)}</span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <button 
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className={`w-12 h-12 flex items-center justify-center rounded-xl bg-transparent border border-[var(--border)] hover:bg-[var(--glass-border)] transition-colors text-[var(--text-primary)] ${showVolumeSlider ? 'bg-[var(--glass-border)]' : ''}`}
              >
                {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 transition-opacity duration-200 bg-[var(--glass-bg)] border border-[var(--border)] p-4 rounded-2xl shadow-xl flex items-center justify-center h-32 w-12 z-50 ${showVolumeSlider ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    handleVolumeChange(val);
                    if (val === 0 && !isMuted) toggleMute();
                  }}
                  className="w-24 h-2 -rotate-90 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--bg-color)] border border-[var(--border)] hover:scale-105 active:scale-95 transition-transform shadow-sm text-[var(--text-primary)]"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 justify-end mt-2">
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




