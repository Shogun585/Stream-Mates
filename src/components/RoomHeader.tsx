'use client';
import { UserButton, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function RoomHeader({ roomCode }: { roomCode: string }) {
  const { user } = useUser();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRoom = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    setIsLeaving(true);
    // Slight delay to allow the overlay to render before navigation unmounts the current page
    setTimeout(() => {
      router.push('/');
    }, 100);
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
              className="px-5 py-2 rounded-full font-bold text-[var(--text-primary)] border-2 border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-color)] transition-all transform hover:-translate-y-1 shadow-[4px_4px_0px_var(--shadow-color)]"
            >
              Share URL
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="scale-[0.80] origin-right md:scale-100">
            <ThemeToggle />
          </div>
          <button 
            onClick={handleLeave}
            className="hidden md:block px-5 py-2 rounded-full font-bold text-[var(--accent)] border-2 border-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-[var(--bg-color)] hover:border-[var(--accent)] transition-all transform hover:-translate-y-1 shadow-[4px_4px_0px_var(--shadow-color)]"
          >
            Leave Room
          </button>
          {user && (
            <div className="flex items-center gap-3 bg-[var(--glass-bg)] border border-[var(--border)] px-2 py-2 md:px-4 md:py-1.5 rounded-full shadow-sm backdrop-blur-md">
              <span className="hidden md:inline font-bold text-sm text-[var(--text-primary)]">
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
