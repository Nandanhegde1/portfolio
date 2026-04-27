/**
 * Lightweight confetti burst — no dependencies. ~80 LOC.
 * Call: burstConfetti({ x, y, count: 60 })
 */
export interface ConfettiOptions {
  x?: number; // viewport X (defaults: center)
  y?: number; // viewport Y
  count?: number;
  colors?: string[];
  spread?: number; // angle range (deg)
  velocity?: number;
}

const DEFAULT_COLORS = ['#6c63ff', '#f43f5e', '#10b981', '#fbbf24', '#06b6d4', '#ec4899'];

export function burstConfetti(opts: ConfettiOptions = {}): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const x = opts.x ?? window.innerWidth / 2;
  const y = opts.y ?? window.innerHeight / 2;
  const count = opts.count ?? 50;
  const colors = opts.colors ?? DEFAULT_COLORS;
  const spread = opts.spread ?? 70;
  const velocity = opts.velocity ?? 12;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }

  const particles = Array.from({ length: count }, () => {
    const angle = (-90 + (Math.random() - 0.5) * spread) * (Math.PI / 180);
    const speed = velocity * (0.6 + Math.random() * 0.8);
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      life: 1,
    };
  });

  const start = performance.now();
  const DURATION = 2000;

  function tick(now: number): void {
    const elapsed = now - start;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.vy += 0.4; // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      p.life = Math.max(0, 1 - elapsed / DURATION);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
      ctx.restore();
    });
    if (elapsed < DURATION) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(tick);
}
