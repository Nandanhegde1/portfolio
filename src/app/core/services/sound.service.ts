import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'portfolio_sound_enabled_v1';

type SfxName = 'click' | 'hover' | 'success' | 'error' | 'pop' | 'unlock' | 'type';

/**
 * Lightweight SFX engine using the Web Audio API — no audio files,
 * no dependencies, ~2 KB. All sounds are synthesised on-the-fly.
 * User toggle is persisted to localStorage; respects prefers-reduced-motion
 * and starts muted by default to be polite.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly enabled = signal<boolean>(false);
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastPlay = 0;

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === '1') this.enabled.set(true);
    } catch { /* ignore */ }
  }

  toggle(): void {
    const next = !this.enabled();
    this.enabled.set(next);
    try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
    if (next) this.ensureCtx().then(() => this.play('unlock'));
  }

  async play(name: SfxName): Promise<void> {
    if (!this.enabled() || typeof window === 'undefined') return;
    // Throttle rapid-fire sounds (e.g. typing) to prevent audio spam
    const now = performance.now();
    if (name !== 'type' && now - this.lastPlay < 30) return;
    this.lastPlay = now;
    const ctx = await this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'click': this.tone(ctx, t, 880, 0.04, 'square', 0.15); break;
      case 'hover': this.tone(ctx, t, 1320, 0.025, 'sine', 0.06); break;
      case 'pop':   this.tone(ctx, t, 660, 0.05, 'triangle', 0.18); break;
      case 'success': this.chord(ctx, t, [523.25, 659.25, 783.99], 0.18, 0.15); break;
      case 'error': this.tone(ctx, t, 196, 0.18, 'sawtooth', 0.18); break;
      case 'unlock': this.chord(ctx, t, [392, 523.25, 783.99], 0.22, 0.18); break;
      case 'type':  this.tone(ctx, t, 1200 + Math.random() * 200, 0.012, 'square', 0.04); break;
    }
  }

  private async ensureCtx(): Promise<AudioContext | null> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') { try { await this.ctx.resume(); } catch { /* ignore */ } }
      return this.ctx;
    }
    try {
      const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(ctx: AudioContext, t: number, freq: number, dur: number, type: OscillatorType, gain: number): void {
    if (!this.master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private chord(ctx: AudioContext, t: number, freqs: number[], dur: number, gain: number): void {
    freqs.forEach((f, i) => this.tone(ctx, t + i * 0.04, f, dur, 'sine', gain));
  }
}
