'use client';
import { UserButton, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { extractYouTubeVideoId } from '../lib/youtube';
import { Search, LogOut } from 'lucide-react';

export default function RoomHeader({ 
  roomCode, 
  disabled = false, 
  onChangeVideo 
}: { 
  roomCode: string;
  disabled?: boolean;
  onChangeVideo?: (id: string) => void;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [url, setUrl] = useState('');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRoom = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    setIsLeaving(true);
    setTimeout(() => {
      router.push('/');
    }, 100);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !onChangeVideo) return;
    const id = extractYouTubeVideoId(url);
    if (id) {
      onChangeVideo(id);
      setUrl('');
    }
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
      <header className="flex items-center justify-between p-6 z-20 bg-transparent font-[family-name:var(--font-inter)]">
        <div className="flex items-center gap-6">
          <div 
            onClick={handleLeave}
            className="font-bold text-2xl tracking-wider text-[var(--text-primary)] hover:scale-110 transition-transform cursor-pointer"
          >
            SM.
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <div 
              onClick={copyToClipboard}
              className="flex items-center gap-3 px-5 py-2 glass-panel rounded-full cursor-pointer group hover:-translate-y-1 transition-transform border-2 border-[var(--text-primary)] shadow-[4px_4px_0px_var(--shadow-color)]"
              title="Click to copy code"
            >
              <span className="font-mono text-xl font-bold text-[var(--accent)]">
                {roomCode}
              </span>
              <span className="font-bold text-sm text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition">
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </div>
            
            <button 
              onClick={shareRoom}
              className="px-5 py-2 rounded-full font-bold text-[var(--text-primary)] border-2 border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-color)] transition-all transform hover:-translate-y-1 shadow-[4px_4px_0px_var(--shadow-color)] whitespace-nowrap"
            >
              Share URL
            </button>
          </div>
        </div>

        {/* Desktop URL Bar */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-8">
          <form onSubmit={handleUrlSubmit} className="flex-1 relative flex items-center">
            <input
              type="text"
              placeholder="Paste YouTube URL..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={disabled}
              className="w-full bg-[var(--bg-color)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl pl-6 pr-12 py-2.5 font-bold text-[var(--text-primary)] focus:outline-none disabled:opacity-50 shadow-inner"
            />
            <button
              type="submit"
              disabled={disabled || !url.trim()}
              className="absolute right-2 p-2 bg-[var(--accent)] text-white rounded-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:transform-none shadow-sm"
              title="Load Video"
            >
              <Search size={18} />
            </button>
          </form>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="scale-[0.80] origin-right md:scale-100">
            <ThemeToggle />
          </div>
          <button 
            onClick={handleLeave}
            className="hidden md:flex items-center justify-center p-2 rounded-xl font-bold text-[var(--accent)] border-2 border-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-[var(--bg-color)] hover:border-[var(--accent)] transition-all transform hover:-translate-y-1 shadow-[4px_4px_0px_var(--shadow-color)]"
            title="Leave Room"
          >
            <LogOut size={20} strokeWidth={2.5} />
          </button>
          {user && (
            <div className="flex items-center gap-3 bg-[var(--glass-bg)] border border-[var(--border)] px-2 py-2 md:px-4 md:py-1.5 rounded-full shadow-sm backdrop-blur-md">
              <span className="hidden lg:inline font-bold text-sm text-[var(--text-primary)] whitespace-nowrap">
                {user.firstName || user.username || 'Welcome'}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </div>
      </header>
    </>
  );
}
