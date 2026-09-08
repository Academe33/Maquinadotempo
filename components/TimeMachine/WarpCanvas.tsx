import React, { useEffect, useRef } from 'react';

export interface WarpControls {
  /** 0 = parado, 1 = vórtice em velocidade máxima */
  intensity: number;
  /** +1 = partículas saem do centro (viagem), -1 = partículas são sugadas (carga) */
  direction: 1 | -1;
  /** Flash branco (0..1) misturado por cima */
  flash: number;
}

interface WarpCanvasProps {
  controls: React.MutableRefObject<WarpControls>;
  className?: string;
}

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  hue: number;
}

const PARTICLE_COUNT = 420;
const RING_COUNT = 14;

const media = (q: string) =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(q).matches;

/**
 * Quantas partículas desenhar. Celular tem tela pequena e GPU modesta:
 * o mesmo enxame do desktop derruba a taxa de quadros sem acrescentar nada
 * que se enxergue. A conta é por área de tela, com teto menor no toque.
 */
function particleBudget(width: number, height: number) {
  if (media('(prefers-reduced-motion: reduce)')) return 90;
  const touch = media('(pointer: coarse)');
  const byArea = Math.round((width * height) / 2600);
  return Math.max(110, Math.min(touch ? 190 : PARTICLE_COUNT, byArea));
}

/** Anéis do túnel: menos alguns no celular, onde quase não se distinguem */
function ringBudget() {
  if (media('(prefers-reduced-motion: reduce)')) return 6;
  return media('(pointer: coarse)') ? 9 : RING_COUNT;
}

// Canvas 2D de "túnel temporal": estrelas em streak radial, anéis do túnel
// em perspectiva, brilho no centro e rotação suave. Todo o estado de
// intensidade vem por ref, para que o loop de RAF não dependa de re-render.
const WarpCanvas: React.FC<WarpCanvasProps> = ({ controls, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let rotation = 0;
    let tunnelPhase = 0;
    let smoothIntensity = 0;

    const particles: Particle[] = [];
    const ringCount = ringBudget();
    const spawn = (p: Particle, fresh: boolean) => {
      p.angle = Math.random() * Math.PI * 2;
      p.radius = fresh ? Math.random() : (controls.current.direction === 1 ? 0.02 + Math.random() * 0.05 : 0.9 + Math.random() * 0.3);
      p.speed = 0.25 + Math.random() * 0.9;
      p.size = 0.6 + Math.random() * 1.8;
      p.hue = 250 + Math.random() * 70; // roxo → magenta, com alguns ciano
      if (Math.random() < 0.15) p.hue = 190 + Math.random() * 20;
    };
    const fitParticles = () => {
      const target = particleBudget(width, height);
      while (particles.length < target) {
        const p = { angle: 0, radius: 0, speed: 0, size: 0, hue: 0 };
        spawn(p, true);
        particles.push(p);
      }
      if (particles.length > target) particles.length = target;
    };

    const resize = () => {
      // Passar de 1.5x no celular só custa preenchimento, sem ganho visível
      const maxDpr = media('(pointer: coarse)') ? 1.5 : 2;
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fitParticles();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { intensity, direction, flash } = controls.current;
      smoothIntensity += (intensity - smoothIntensity) * Math.min(1, dt * 4);
      const k = smoothIntensity;

      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.hypot(cx, cy);

      // Rastro: quanto mais intenso, mais longo o rastro (fundo menos opaco)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(4, 0, 12, ${0.55 - k * 0.4})`;
      ctx.fillRect(0, 0, width, height);

      rotation += dt * (0.05 + k * 1.4) * direction;
      tunnelPhase = (tunnelPhase + dt * (0.05 + k * 1.6) * direction + 1) % 1;

      // ----- Anéis do túnel -----
      if (k > 0.03) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation * 0.35);
        for (let i = 0; i < ringCount; i++) {
          const z = ((i / ringCount + tunnelPhase) % 1 + 1) % 1; // 0 (longe) → 1 (perto)
          const r = Math.pow(z, 2.2) * maxR * 1.1;
          if (r < 2) continue;
          const alpha = Math.pow(z, 1.5) * 0.5 * k;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.lineWidth = 1 + z * 3;
          ctx.strokeStyle = `hsla(${270 + i * 6}, 95%, ${60 + z * 25}%, ${alpha})`;
          ctx.stroke();

          // Segmentos "quebrados" para dar a sensação de dobra
          const segs = 6;
          for (let s = 0; s < segs; s++) {
            const a0 = (s / segs) * Math.PI * 2 + i * 0.4;
            ctx.beginPath();
            ctx.arc(0, 0, r, a0, a0 + 0.35);
            ctx.lineWidth = 2 + z * 5;
            ctx.strokeStyle = `hsla(${200 + i * 10}, 100%, 75%, ${alpha * 0.9})`;
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // ----- Partículas em streak -----
      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        const prevR = p.radius;
        const vel = p.speed * (0.02 + k * 1.25) * direction;
        p.radius += vel * dt * (0.5 + p.radius); // acelera conforme se afasta do centro
        p.angle += dt * k * 0.25 * direction;

        if (p.radius > 1.25 || p.radius < 0.01) {
          spawn(p, false);
          continue;
        }

        const r0 = Math.pow(prevR, 1.6) * maxR;
        const r1 = Math.pow(p.radius, 1.6) * maxR;
        const cosA = Math.cos(p.angle + rotation * 0.2);
        const sinA = Math.sin(p.angle + rotation * 0.2);
        const x0 = cx + cosA * r0;
        const y0 = cy + sinA * r0;
        const x1 = cx + cosA * r1;
        const y1 = cy + sinA * r1;

        const brightness = 0.25 + p.radius * 0.75;
        ctx.strokeStyle = `hsla(${p.hue}, 100%, ${55 + brightness * 30}%, ${(0.25 + k * 0.7) * brightness})`;
        ctx.lineWidth = p.size * (0.6 + k * 1.4 * p.radius);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1 + (x1 - x0) * k * 2, y1 + (y1 - y0) * k * 2);
        ctx.stroke();
      }

      // ----- Brilho central -----
      const glowR = maxR * (0.12 + k * 0.4);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(216, 180, 254, ${0.12 + k * 0.55})`);
      glow.addColorStop(0.35, `rgba(168, 85, 247, ${0.08 + k * 0.3})`);
      glow.addColorStop(1, 'rgba(88, 28, 135, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);

      // ----- Flash -----
      if (flash > 0.001) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, flash)})`;
        ctx.fillRect(0, 0, width, height);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [controls]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};

export default WarpCanvas;
