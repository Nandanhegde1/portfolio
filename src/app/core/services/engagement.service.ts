import { Injectable, computed, signal, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface SectionVisit {
  path: string;
  visitedAt: number;
  dwellMs: number;
}

/**
 * Tracks engagement: which sections a visitor has explored, time spent,
 * and computes a "Hire Score" out of 100. Persists in localStorage so
 * recruiters returning later keep their progress.
 */
@Injectable({ providedIn: 'root' })
export class EngagementService {
  private readonly router = inject(Router);
  private readonly STORAGE_KEY = 'portfolio_engagement_v1';

  // Sections that count toward the score (weighted)
  private readonly weights: Record<string, number> = {
    '/': 10,
    '/about': 20,
    '/dashboard': 20,
    '/blog': 15,
    '/lab': 10,
    '/quiz': 10,
    '/roast-me-back': 8,
    '/contact': 7,
  };
  private readonly maxScore = Object.values(this.weights).reduce((a, b) => a + b, 0);

  readonly visits = signal<SectionVisit[]>(this.load());
  readonly currentPath = signal<string>('/');
  private currentEnter = Date.now();

  readonly score = computed(() => {
    const visited = new Set(this.visits().map((v) => v.path));
    let pts = 0;
    visited.forEach((p) => {
      if (this.weights[p] != null) pts += this.weights[p];
    });
    return Math.min(100, Math.round((pts / this.maxScore) * 100));
  });

  readonly tier = computed(() => {
    const s = this.score();
    if (s >= 90) return { label: '🏆 Legend', color: '#fbbf24' };
    if (s >= 70) return { label: '🔥 On fire', color: '#f43f5e' };
    if (s >= 50) return { label: '✨ Curious', color: '#6c63ff' };
    if (s >= 25) return { label: '👀 Browsing', color: '#10b981' };
    return { label: '👋 New here', color: '#94a3b8' };
  });

  readonly visitedCount = computed(() => new Set(this.visits().map((v) => v.path)).size);

  init(): void {
    if (typeof window === 'undefined') return;
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => this.recordVisit(e.urlAfterRedirects.split('?')[0].split('#')[0]));
  }

  private recordVisit(path: string): void {
    const now = Date.now();
    // Close out previous section's dwell time
    const prev = this.currentPath();
    const dwell = now - this.currentEnter;
    if (prev && this.weights[prev] != null && dwell > 1000) {
      this.visits.update((list) => {
        const existing = list.find((v) => v.path === prev);
        if (existing) {
          existing.dwellMs += dwell;
          return [...list];
        }
        return list;
      });
    }
    // Record new section
    if (this.weights[path] != null) {
      this.visits.update((list) => {
        if (list.some((v) => v.path === path)) return list;
        return [...list, { path, visitedAt: now, dwellMs: 0 }];
      });
    }
    this.currentPath.set(path);
    this.currentEnter = now;
    this.persist();
  }

  reset(): void {
    this.visits.set([]);
    this.persist();
  }

  private load(): SectionVisit[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.visits()));
    } catch {
      /* quota or SSR */
    }
  }
}
