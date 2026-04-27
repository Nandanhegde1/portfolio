import { Injectable, signal, inject } from '@angular/core';
import { burstConfetti } from '../../shared/utils/confetti';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  emoji?: string;
  variant: 'achievement' | 'info' | 'success' | 'error';
  durationMs: number;
}

/**
 * Global toast queue. Use for celebratory moments + transient info.
 * Achievements automatically fire confetti.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(toast: Omit<Toast, 'id'>): void {
    const t: Toast = { ...toast, id: crypto.randomUUID() };
    this.toasts.update((list) => [...list, t]);
    setTimeout(() => this.dismiss(t.id), t.durationMs);
  }

  achievement(title: string, message: string, emoji = '🏆'): void {
    this.show({ title, message, emoji, variant: 'achievement', durationMs: 5500 });
    // Confetti from top-right where toast appears
    if (typeof window !== 'undefined') {
      burstConfetti({ x: window.innerWidth - 120, y: 80, count: 60, spread: 100 });
    }
  }

  success(title: string, message?: string): void {
    this.show({ title, message, emoji: '✅', variant: 'success', durationMs: 3500 });
  }

  info(title: string, message?: string): void {
    this.show({ title, message, emoji: 'ℹ️', variant: 'info', durationMs: 3500 });
  }

  error(title: string, message?: string): void {
    this.show({ title, message, emoji: '⚠️', variant: 'error', durationMs: 4500 });
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
