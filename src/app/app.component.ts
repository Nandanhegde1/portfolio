import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './core/services/seo.service';
import { EngagementService } from './core/services/engagement.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
  styles: [`:host { display: block; }`],
})
export class AppComponent {
  private readonly seo = inject(SeoService);
  private readonly engagement = inject(EngagementService);

  constructor() {
    this.seo.init();
    this.engagement.init();
    this.registerServiceWorker();
  }

  private registerServiceWorker(): void {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Only in production builds (avoid stale SW during ng serve)
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {
        /* silently fail \u2014 SW is non-critical */
      });
    });
  }
}
