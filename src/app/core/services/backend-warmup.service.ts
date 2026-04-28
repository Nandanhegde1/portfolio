import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Pings the backend `/api/health` endpoint on app boot and at a regular
 * interval to keep Render's free-tier instance warm. Render free dynos
 * sleep after ~15 min of inactivity and take ~30s to cold-start, which
 * makes lab/roast features feel broken on first interaction.
 *
 * Strategy:
 *  - Fire-and-forget ping immediately on init (warms dyno before user clicks).
 *  - Re-ping every 10 minutes while the tab is visible.
 *  - Skip pings while the tab is hidden to be polite + save quota.
 *  - Single global instance; multiple init() calls are idempotent.
 */
@Injectable({ providedIn: 'root' })
export class BackendWarmupService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/health`;
  private readonly intervalMs = 10 * 60 * 1000; // 10 min
  private timerId: ReturnType<typeof setInterval> | null = null;
  private started = false;

  init(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    // Immediate warmup on app load
    this.ping();

    // Re-ping on visibility regain (user returns to tab after a while)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.ping();
    });

    // Periodic keep-alive while tab is open
    this.timerId = setInterval(() => {
      if (!document.hidden) this.ping();
    }, this.intervalMs);
  }

  private ping(): void {
    this.http.get(this.url, { responseType: 'text' }).subscribe({
      next: () => {},
      error: () => {},
    });
  }
}
