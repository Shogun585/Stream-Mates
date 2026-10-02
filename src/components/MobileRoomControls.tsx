'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { extractYouTubeVideoId } from '../lib/youtube';

interface MobileRoomControlsProps {
  roomCode: string;
  disabled: boolean;
  onChangeVideo: (videoId: string) => void;
  onRequestControl?: () => void;
}

export default function MobileRoomControls({ roomCode, disabled, onChangeVideo, onRequestControl }: MobileRoomControlsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [url, setUrl] = useState('');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeVideoId(url);
    if (id) {
      onChangeVideo(id);
      setUrl('');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRoom = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    setIsLeaving(true);
    setTimeout(() => router.push('/'), 100);
  };

  return (
    <>
      {isLeaving && (
        <div className="fixed inset-0 bg-[var(--bg-color)]/50 backdrop-blur-sm z-[9999] flex items-center justify-center cursor-not-allowed">
          <div className="bg-[var(--glass-bg)] p-6 rounded-2xl backdrop-blur-md border border-[var(--border)] shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-[var(--text-primary)] tracking-widest text-lg">LEAVING ROOM...</p>
          </div>
        </div>
      )}
      <div className="md:hidden flex flex-col gap-4 mt-2 mb-4 w-full px-2">
        {/* Row 0: Paste URL Box */}
        <form onSubmit={handleUrlSubmit} className="flex gap-2 w-full">
          <input type="text" placeholder="Paste YouTube URL..." value={url} onChange={e => setUrl(e.target.value)} disabled={disabled} className="flex-1 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] focus:border-[var(--accent)] rounded-xl px-4 py-3 font-bold text-[var(--text-primary)] focus:outline-none disabled:opacity-50 shadow-inner" />
          <button type="submit" disabled={disabled || !url.trim()} className="px-5 py-3 bg-[var(--droplet-4)] text-[var(--bg-color)] font-bold rounded-xl active:scale-95 transition-transform shadow-sm disabled:opacity-50">Load</button>
        </form>

        {/* Row 0.5: Request Remote */}
        {disabled && onRequestControl && (
          <button onClick={onRequestControl} className="w-full py-3 bg-[var(--droplet-2)] text-[var(--bg-color)] font-bold rounded-xl active:scale-95 transition-transform shadow-sm">Request Remote</button>
        )}

        {/* Row 1: Invite code & Share URL icon */}
        <div className="flex items-center gap-3 w-full">
          <div 
            onClick={copyToClipboard}
            className="flex-1 flex justify-between items-center px-5 py-3 glass-panel rounded-full cursor-pointer group active:scale-95 transition-transform border-2 border-[var(--text-primary)] shadow-[3px_3px_0px_var(--shadow-color)]"
          >
            <span className="font-mono text-xl font-bold text-[var(--accent)] tracking-wider">
              {roomCode}
            </span>
            <span className="font-bold text-sm text-[var(--text-muted)]">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </div>
          
          <button 
            onClick={shareRoom}
            className="p-3.5 rounded-full font-bold text-[var(--text-primary)] border-2 border-[var(--text-primary)] bg-transparent active:bg-[var(--text-primary)] active:text-[var(--bg-color)] transition-all active:scale-95 shadow-[3px_3px_0px_var(--shadow-color)] flex items-center justify-center"
            title="Share URL"
          >
            <Share2 size={20} />
          </button>
        </div>

        {/* Row 2: Leave meeting */}
        <button 
          onClick={handleLeave}
          className="w-full py-3 rounded-full font-bold text-[var(--accent)] border-2 border-[var(--text-primary)] active:bg-[var(--accent)] active:text-[var(--bg-color)] active:border-[var(--accent)] transition-all active:scale-95 shadow-[3px_3px_0px_var(--shadow-color)]"
        >
          Leave Room
        </button>
      </div>
    </>
  );
}

