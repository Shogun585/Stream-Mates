'use client';

import { useEffect, useRef } from 'react';

export const LoadingScreen = ({ status }: { status: 'idle' | 'success' | 'error' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    // Physics variables
    let ballY = height / 2;
    let ballVelocity = 0;
    const gravity = 0.6;
    const bounceForce = -14;
    const floor = height / 2 + 50;

    let particles: any[] = [];
    let splattered = false;

    const spawnParticles = (color: string) => {
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 20 + 5;
        particles.push({
          x: width / 2,
          y: ballY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 5,
          radius: Math.random() * 8 + 2,
          color: color,
          alpha: 1
        });
      }
    };

    const draw = () => {
      // Create trailing effect by filling with slight opacity
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);

      if (status === 'idle' && !splattered) {
        // Bounce physics
        ballVelocity += gravity;
        ballY += ballVelocity;
        
        // Floor collision
        if (ballY > floor) {
          ballY = floor;
          ballVelocity = bounceForce; 
        }

        ctx.beginPath();
        ctx.arc(width / 2, ballY, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ef4444';
        ctx.fill();
        ctx.shadowBlur = 0;
      } 
      else if (status !== 'idle' && !splattered) {
        splattered = true;
        spawnParticles(status === 'success' ? '#ef4444' : '#6b7280'); // red or gray
      }
      
      if (splattered) {
        // Draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.vy += gravity; // Apply gravity
          p.vx *= 0.98; // Friction
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.015; // Fade out

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.shadowBlur = 15;
          ctx.shadowColor = p.color;
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [status]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ background: '#000' }}
    />
  );
};
