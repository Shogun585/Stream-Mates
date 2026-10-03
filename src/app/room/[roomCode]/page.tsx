'use client';
import { useSocket } from '../../../hooks/useSocket';
import RoomHeader from '../../../components/RoomHeader';
import MobileRoomControls from '../../../components/MobileRoomControls';
import YouTubePlayer from '../../../components/YouTubePlayer';
import ParticipantList from '../../../components/ParticipantList';
import ChatPanel from '../../../components/ChatPanel';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { LoadingScreen } from '../../../components/LoadingScreen';

const DropletBackground = () => {
  const [droplets, setDroplets] = useState<any[]>([]);
  useEffect(() => {
    const baseCount = 15;
    const extraLeftCount = Math.floor(baseCount * 0.20);
    const totalCount = baseCount + extraLeftCount;

    const newDroplets = Array.from({ length: totalCount }).map((_, i) => {
      const colors = ['var(--droplet-1)', 'var(--droplet-2)', 'var(--droplet-3)', 'var(--droplet-4)'];
      
      const isExtraLeft = i >= baseCount;
      const leftVal = isExtraLeft ? Math.random() * 30 : Math.random() * 100;
      
      const baseSize = Math.random() * 30 + 10;
      const finalSize = Math.random() > 0.5 ? baseSize * 2 : baseSize;

      return {
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: `${leftVal}vw`,
        top: `${-20 - Math.random() * 50}vh`,
        size: `${finalSize}px`,
        delay: `${Math.random() * 5}s`,
        duration: `${Math.random() * 10 + 10}s`, // slower in room so it isn't distracting
      };
    });
    setDroplets(newDroplets);
  }, []);
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {droplets.map(d => (
        <div key={d.id} className="absolute rounded-full opacity-30 mix-blend-screen" style={{
          backgroundColor: d.color, width: d.size, height: d.size, left: d.left, top: d.top,
          animation: `fall ${d.duration} linear ${d.delay} infinite`, filter: 'blur(4px)', boxShadow: `0 0 20px ${d.color}`
        }} />
      ))}
    </div>
  );
};

export default function RoomPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const roomCode = params.roomCode as string;
  
  const { roomState, messages, error, emit, pendingRequest, setPendingRequest } = useSocket({ roomCode });
  
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const fullscreenWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = window.matchMedia("(pointer: coarse)").matches;
      // Consider it mobile if it's a touch device or the screen is very small
      setIsMobile(hasTouch || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await fullscreenWrapperRef.current?.requestFullscreen();
        if (isMobile && screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape');
        }
      } catch (err) {
        console.log('Error attempting to enable fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        if (isMobile && screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (err) {
        console.log('Error attempting to disable fullscreen:', err);
      }
    }
  }, [isMobile]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isLoaded || !roomState) return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      <LoadingScreen status="idle" />
    </div>
  );
  if (!user) return <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center font-bold text-2xl tracking-widest text-[var(--text-primary)]">Sign in to join room.</div>;

  const participants = roomState.participants || [];
  const currentUser = participants.find(p => p.clerkId === user?.id);
  const role = currentUser?.role || 'participant';
  const hasControl = role === 'host' || role === 'moderator';
  const isPlaying = roomState.playState === 'playing';

  const handleTimeUpdate = (time: number, dur: number) => {
    setLocalTime(time);
    setDuration(dur);
  };

  const handlePlayPause = (play: boolean) => {
    if (play) emit('play', { time: localTime });
    else emit('pause', { time: localTime });
  };

  const handleSeek = (time: number) => {
    emit('seek', time);
    setLocalTime(time);
  };

  const handleChangeVideo = (videoId: string) => {
    emit('change_video', videoId);
  };

  const handleSendMessage = (content: string) => {
    emit('send_message', { 
      content,
      username: user.username || user.firstName || 'Anonymous',
    });
  };

  return (
    <div className="flex flex-col min-h-[100dvh] md:h-screen bg-[var(--bg-color)] overflow-y-auto overflow-x-hidden md:overflow-hidden relative selection:bg-[var(--accent)] selection:text-white">
      <DropletBackground />
      <RoomHeader roomCode={roomCode} disabled={!hasControl} onChangeVideo={handleChangeVideo} />
      
      {/* Error/notification toast */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-3 rounded-xl border-2 border-[var(--accent)] text-[var(--text-primary)] font-bold shadow-[4px_4px_0px_var(--accent)] animate-bounce">
          {error}
        </div>
      )}

      {/* Approval Toast */}
      {pendingRequest && hasControl && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-4 rounded-xl border-2 border-[var(--droplet-2)] shadow-[4px_4px_0px_var(--droplet-2)] flex flex-col items-center gap-4">
          <span className="font-bold text-lg text-[var(--text-primary)]"><span className="text-[var(--accent)]">{pendingRequest.username}</span> wants the remote.</span>
          <div className="flex gap-4">
            <button 
              onClick={() => { emit('approve_request', pendingRequest.clerkId); setPendingRequest(null); }} 
              className="px-6 py-2 bg-[var(--droplet-3)] text-[var(--bg-color)] font-bold rounded-xl border-2 border-[var(--text-primary)] hover:-translate-y-1 active:translate-y-1 transition-transform shadow-[2px_2px_0px_var(--text-primary)]"
            >
              Hand over
            </button>
            <button 
              onClick={() => setPendingRequest(null)} 
              className="px-6 py-2 bg-transparent text-[var(--text-primary)] font-bold rounded-xl border-2 border-[var(--text-primary)] hover:-translate-y-1 active:translate-y-1 transition-transform shadow-[2px_2px_0px_var(--shadow-color)]"
            >
              Keep it
            </button>
          </div>
        </div>
      )}
      
      <div ref={fullscreenWrapperRef} className={`flex flex-1 overflow-visible md:overflow-hidden z-10 relative transition-all duration-300 ${isFullscreen ? 'flex-row gap-0 p-0 bg-black' : 'flex-col md:flex-row gap-6 p-6 bg-transparent'}`}>
        {/* Main Area: Video with Integrated Controls */}
        <div className={`sticky top-6 z-30 md:static flex-none md:flex-1 h-[40vh] md:h-auto flex flex-col min-w-0 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] overflow-hidden relative transition-all duration-500 ${isFullscreen ? 'rounded-none shadow-none border-none' : 'rounded-2xl shadow-xl'}`}>
          <div className="flex-1 relative bg-black">
            <YouTubePlayer 
              videoId={roomState?.videoId || ''}
              roomState={roomState}
              disabled={!hasControl}
              onEmit={emit}
              onTimeUpdate={handleTimeUpdate}
              isPlaying={isPlaying}
              currentTime={localTime}
              duration={duration}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onChangeVideo={handleChangeVideo}
              onRequestControl={() => emit('request_control')}
              isSidebarOpen={isSidebarOpen}
              isFullscreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
              isMobile={isMobile}
            />
            
            {/* Expand Sidebar Button */}
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className={`absolute top-4 right-4 z-30 p-3 bg-[var(--glass-bg)] backdrop-blur-xl border-2 border-[var(--text-primary)] rounded-xl text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-transform shadow-[3px_3px_0px_var(--shadow-color)] group ${isFullscreen ? 'opacity-50 hover:opacity-100' : ''}`}
                title="Expand Sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
          </div>
        </div>

        <MobileRoomControls roomCode={roomCode} disabled={!hasControl} onChangeVideo={handleChangeVideo} onRequestControl={() => emit('request_control')} />

        {/* Sidebar Area: Participants + Chat in ONE box */}
        <div 
          className={`flex flex-col bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isFullscreen ? 'rounded-none border-none shadow-none z-50' : 'rounded-2xl'} ${
            isSidebarOpen 
              ? `h-[60vh] md:h-auto opacity-100 translate-y-0 md:translate-x-0 mt-0 md:ml-0 ${isMobile && isFullscreen ? 'w-[240px]' : 'w-full md:w-[380px]'}` 
              : `h-0 md:h-auto opacity-0 -translate-y-4 md:translate-y-0 md:translate-x-full md:ml-[-24px] border-none mb-4 md:mb-0 ${isMobile && isFullscreen ? 'w-[240px]' : 'w-full md:w-0'}`
          }`}
        >
          <div className={`${isMobile && isFullscreen ? 'h-auto min-h-0 hidden' : 'h-1/3 min-h-[180px]'} border-b border-[var(--border)] flex flex-col relative w-full`}>
            <ParticipantList 
              participants={participants}
              onAssignRole={(clerkId, role) => emit('assign_role', { targetClerkId: clerkId, role })}
              onRemove={(clerkId) => emit('remove_participant', clerkId)}
              onTransferHost={(clerkId) => emit('transfer_host', clerkId)}
              onApproveRequest={(clerkId) => emit('approve_request', clerkId)}
              onCollapse={() => setIsSidebarOpen(false)}
              hideList={isMobile && isFullscreen}
            />
          </div>
          <div className="flex-1 flex flex-col overflow-hidden w-full relative">
            {isMobile && isFullscreen && (
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 z-50 p-2 bg-transparent border-2 border-[var(--border)] rounded-lg text-[var(--text-primary)] hover:border-[var(--text-primary)] hover:bg-[var(--glass-border)] transition-colors group shadow-sm"
                title="Collapse Sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            )}
            <ChatPanel 
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

