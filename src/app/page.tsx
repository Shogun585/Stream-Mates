'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import ThemeToggle from '../components/ThemeToggle';
import { ChevronDown, PlusCircle, Users, MonitorPlay, Zap, MessageSquare, ShieldCheck, Keyboard } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';

const DropletBackground = () => {
  const [droplets, setDroplets] = useState<any[]>([]);

  useEffect(() => {
    // Generate static random values for droplets on client mount to avoid hydration mismatch
    const baseCount = 25;
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
        duration: `${Math.random() * 5 + 5}s`,
      };
    });
    setDroplets(newDroplets);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {droplets.map(d => (
        <div
          key={d.id}
          className="absolute rounded-full opacity-60 mix-blend-screen"
          style={{
            backgroundColor: d.color,
            width: d.size,
            height: d.size,
            left: d.left,
            top: d.top,
            animation: `fall ${d.duration} linear ${d.delay} infinite`,
            filter: 'blur(4px)',
            boxShadow: `0 0 20px ${d.color}`
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fall {
          0% {
            transform: translate(0, 0) rotate(45deg) scale(1);
            opacity: 0;
          }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% {
            transform: translate(-50vw, 120vh) rotate(45deg) scale(0.5);
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
};


const HowItWorksSection = () => {
  const steps = [
    { icon: <PlusCircle size={48} />, title: "Create a Room", desc: "Just hit start and we'll spin up a private theater just for you." },
    { icon: <Users size={48} />, title: "Invite Friends", desc: "Share your unique room code. They can join instantly without making an account." },
    { icon: <MonitorPlay size={48} />, title: "Watch in Sync", desc: "Paste any YouTube link. If you pause, it pauses for everyone." }
  ];

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative z-10 py-24 px-6">
      <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-16 text-center">How it works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {steps.map((step, i) => (
          <div 
            key={i} 
            className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center group hover:-translate-y-2 transition-transform"
          >
            <div className="w-20 h-20 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center mb-6 transform -rotate-3 group-hover:rotate-0 transition-transform shadow-[4px_4px_0px_var(--text-primary)] border-2 border-[var(--text-primary)]">
              {step.icon}
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">{step.title}</h3>
            <p className="text-[var(--text-muted)] font-medium leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [splatterState, setSplatterState] = useState<'idle' | 'success' | 'error'>('idle');

  const handleCreateRoom = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    
    setIsCreating(true);
    setSplatterState('idle');
    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSplatterState('success');
        setTimeout(() => {
          router.push(`/room/${data.roomCode}`);
        }, 1000);
      } else {
        setSplatterState('error');
        setTimeout(() => {
          setIsCreating(false);
        }, 2000);
      }
    } catch (e) {
      setSplatterState('error');
      setTimeout(() => {
        setIsCreating(false);
      }, 2000);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      if (!isSignedIn) {
        router.push('/sign-in');
        return;
      }
      router.push(`/room/${roomCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen relative selection:bg-[var(--accent)] selection:text-white bg-[var(--bg-color)]">
      {isCreating && <LoadingScreen status={splatterState} />}
      <DropletBackground />
      
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-20 font-[family-name:var(--font-inter)]">
        <div className="font-bold text-2xl tracking-wider text-[var(--text-primary)] hover:scale-110 transition-transform cursor-pointer">
          SM.
        </div>
        <div className="flex gap-4 md:gap-6 items-center">
          <div className="scale-[0.80] origin-right md:scale-100"><ThemeToggle /></div>
          {isLoaded && isSignedIn && user ? (
            <div className="flex items-center gap-3 bg-[var(--glass-bg)] border border-[var(--border)] px-2 py-2 md:px-4 md:py-1.5 rounded-full shadow-sm backdrop-blur-md">
              <span className="hidden md:inline font-bold text-sm text-[var(--text-primary)]">
                {user.firstName || user.username || 'Welcome'}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : isLoaded ? (
            <button 
              onClick={() => router.push('/sign-in')}
              className="px-5 py-2 rounded-full font-bold text-[var(--text-primary)] border-2 border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-color)] transition-all transform hover:-translate-y-1 shadow-[4px_4px_0px_var(--shadow-color)]"
            >
              Log in
            </button>
          ) : null}
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center relative px-6 z-10 pt-20">
        <div className="glass-panel p-10 rounded-[2rem] flex flex-col items-center text-center relative overflow-hidden group w-full max-w-md">
          <h1 className="text-6xl font-black mb-4 text-[var(--text-primary)] leading-tight transform -rotate-2 group-hover:rotate-0 transition-transform duration-300">
            Stream <br/><span className="text-[var(--accent)] drop-shadow-sm">Mates</span>
          </h1>
          
          <p className="text-xl text-[var(--text-muted)] mb-8 font-medium">
            Watch YouTube together. Like a living room, but on the internet.
          </p>

          <div className="w-full space-y-6">
            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full py-4 rounded-xl bg-[var(--accent)] text-white font-bold text-2xl transition-all transform hover:-translate-y-1 active:translate-y-1 shadow-[4px_4px_0px_var(--text-primary)] border-2 border-[var(--text-primary)] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isCreating ? 'Creating a room...' : 'Start a room'}
            </button>

            <div className="flex items-center text-[var(--text-muted)] font-bold">
              <div className="flex-1 border-t-2 border-dashed border-[var(--border)]"></div>
              <span className="px-4 tracking-widest text-sm">OR</span>
              <div className="flex-1 border-t-2 border-dashed border-[var(--border)]"></div>
            </div>

            <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Paste room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full bg-transparent border-2 border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-5 py-4 text-center text-2xl text-[var(--text-primary)] focus:outline-none uppercase placeholder:normal-case placeholder:text-[var(--text-muted)] font-bold transition-colors shadow-inner"
              />
              <button
                type="submit"
                disabled={!roomCode.trim()}
                className="w-full py-4 rounded-xl bg-transparent text-[var(--text-primary)] font-bold text-xl transition-all transform hover:-translate-y-1 active:translate-y-1 border-2 border-[var(--text-primary)] disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none hover:shadow-[4px_4px_0px_var(--shadow-color)]"
              >
                Join room
              </button>
            </form>
          </div>
        </div>
        
        <div 
          className="mt-12 animate-bounce text-[var(--text-muted)] flex flex-col items-center cursor-pointer hover:text-[var(--text-primary)] transition-colors"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span className="text-xs font-bold tracking-widest uppercase mb-2">Discover More</span>
          <ChevronDown size={24} />
        </div>
      </section>

      <HowItWorksSection />

      {/* Features Bento Box */}
      <section className="min-h-screen flex flex-col items-center justify-center relative z-10 py-24 px-6">
        <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-16 text-center">Everything you need.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          
          <div className="glass-panel p-8 rounded-3xl flex flex-col group hover:-translate-y-1 transition-transform col-span-1 md:col-span-2">
            <Zap size={32} className="text-[var(--droplet-2)] mb-4" />
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Zero-Latency Syncing</h3>
            <p className="text-[var(--text-muted)] font-medium text-lg max-w-xl">
              Powered by WebSockets, our rubber-banding algorithm ensures everyone is watching the exact same frame at the exact same time. Say goodbye to counting down "3, 2, 1, Play".
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl flex flex-col group hover:-translate-y-1 transition-transform">
            <MessageSquare size={32} className="text-[var(--droplet-4)] mb-4" />
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Live Chat</h3>
            <p className="text-[var(--text-muted)] font-medium">
              A real-time chat box is built straight into the sidebar so you can react to the video without ever leaving the page.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl flex flex-col group hover:-translate-y-1 transition-transform">
            <ShieldCheck size={32} className="text-[var(--droplet-3)] mb-4" />
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Role Management</h3>
            <p className="text-[var(--text-muted)] font-medium">
              Take the Host seat. Pass the remote to a Moderator. Kick out trolls. You have full control over who gets to change the video.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl flex flex-col group hover:-translate-y-1 transition-transform col-span-1 md:col-span-2 items-center text-center">
            <Keyboard size={32} className="text-[var(--droplet-1)] mb-4" />
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Smart Keyboard Shortcuts</h3>
            <p className="text-[var(--text-muted)] font-medium max-w-lg mb-6">
              Use J, K, L, Spacebar, and arrow keys just like you would on native YouTube. It works flawlessly.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-[var(--border)] text-center">
        <p className="text-[var(--text-muted)] font-bold mb-2">Built for movie nights.</p>
        <div className="flex justify-center gap-4 text-sm font-bold">
          <a href="https://github.com/Shogun585/Stream-Mates.git" className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
}



