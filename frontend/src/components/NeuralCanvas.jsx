import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 65;
const LINK_DIST      = 140;
const MOUSE_ATTRACT  = 180;

export default function NeuralCanvas({ style = {} }) {
  const canvasRef = useRef(null);

  // Don't render particle canvas on mobile/touch screens to eliminate rendering lag on phones
  const isMobile = typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
  if (isMobile) return null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMouseMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:     Math.random() * (canvas.width  || 1920),
      y:     Math.random() * (canvas.height || 1080),
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    (Math.random() - 0.5) * 0.35,
      r:     Math.random() * 1.8 + 0.8,
      cyan:  Math.random() > 0.45,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d  = Math.hypot(dx, dy);
        if (d < MOUSE_ATTRACT && d > 0) {
          const force = (MOUSE_ATTRACT - d) / MOUSE_ATTRACT * 0.018;
          p.vx += dx / d * force;
          p.vy += dy / d * force;
        }
        p.vx *= 0.978;
        p.vy *= 0.978;
        p.x  += p.vx;
        p.y  += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.cyan ? 'rgba(0,219,231,0.75)' : 'rgba(210,255,0,0.65)';
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.28;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,219,231,${alpha})`;
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }}
    />
  );
}
