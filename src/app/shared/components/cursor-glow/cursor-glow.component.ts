import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Soft cursor glow trail — a single radial-gradient blob follows the cursor.
 * Tasteful (not distracting), respects reduced-motion, hidden on touch.
 * User can mute via the toggle in footer/settings.
 */
@Component({
  selector: 'app-cursor-glow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (enabled()) {
      <div #blob class="cursor-glow" aria-hidden="true"></div>
    }
  `,
  styles: [`
    .cursor-glow {
      position: fixed;
      top: 0; left: 0;
      width: 360px; height: 360px;
      pointer-events: none;
      z-index: 1;
      transform: translate(-50%, -50%) translate3d(var(--gx, -1000px), var(--gy, -1000px), 0);
      background: radial-gradient(circle, rgba(108, 99, 255, 0.18) 0%, rgba(108, 99, 255, 0.05) 35%, transparent 65%);
      filter: blur(40px);
      will-change: transform;
      transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
      mix-blend-mode: screen;
    }
    @media (prefers-reduced-motion: reduce) {
      .cursor-glow { display: none; }
    }
    @media (hover: none), (max-width: 768px) {
      .cursor-glow { display: none; }
    }
  `],
})
export class CursorGlowComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  readonly enabled = signal(true);
  private rafId = 0;
  private targetX = -1000;
  private targetY = -1000;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.enabled.set(false);
      return;
    }
    if (localStorage.getItem('cursor_glow_off') === '1') {
      this.enabled.set(false);
      return;
    }
    window.addEventListener('mousemove', this.onMove, { passive: true });
    this.tick();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.removeEventListener('mousemove', this.onMove);
    cancelAnimationFrame(this.rafId);
  }

  private onMove = (e: MouseEvent): void => {
    this.targetX = e.clientX;
    this.targetY = e.clientY;
  };

  private tick = (): void => {
    document.documentElement.style.setProperty('--gx', `${this.targetX}px`);
    document.documentElement.style.setProperty('--gy', `${this.targetY}px`);
    this.rafId = requestAnimationFrame(this.tick);
  };
}
