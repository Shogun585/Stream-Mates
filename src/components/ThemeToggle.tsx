'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-16 h-8 rounded-full bg-[var(--glass-border)] opacity-50"></div>; // skeleton
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-16 h-8 rounded-full overflow-hidden border-2 border-[var(--border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all duration-500 shadow-[2px_2px_0px_var(--shadow-color)] group"
      aria-label="Toggle Theme"
      style={{
        backgroundColor: isDark ? '#2E1065' : '#7DD3FC', // Deep purple vs Sky blue
      }}
    >
      {/* Background Decorative Stars/Clouds (Optional) */}
      <div 
        className="absolute inset-0 transition-opacity duration-500 flex items-center justify-between px-2"
        style={{ opacity: isDark ? 1 : 0 }}
      >
        <div className="w-1 h-1 bg-white rounded-full opacity-70"></div>
        <div className="w-0.5 h-0.5 bg-white rounded-full opacity-50 mt-2"></div>
      </div>

      {/* Thumb / Knob */}
      <div
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          transform: isDark ? 'translateX(32px)' : 'translateX(0)',
          backgroundColor: isDark ? '#F1F5F9' : '#FBBF24', // White moon vs Yellow sun
          boxShadow: isDark ? 'inset -2px -2px 4px rgba(0,0,0,0.2)' : '0 0 10px rgba(251,191,36,0.6)'
        }}
      >
        {isDark ? (
          <Moon size={12} className="text-slate-400" />
        ) : (
          <Sun size={12} className="text-orange-600" />
        )}
      </div>
    </button>
  );
}
