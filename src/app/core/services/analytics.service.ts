import { Injectable, signal } from '@angular/core';
import { VisitorStats } from '../models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly BACKEND_URL = '/api/analytics';

  readonly visitorStats = signal<VisitorStats>({
    totalVisits: 1247,
    uniqueVisitors: 892,
    pageViews: 3456,
    topPages: [
      { path: '/', views: 1200 },
      { path: '/projects', views: 890 },
      { path: '/dashboard', views: 650 },
      { path: '/blog', views: 420 },
      { path: '/contact', views: 296 },
    ],
    referrers: [
      { source: 'LinkedIn', count: 340 },
      { source: 'GitHub', count: 280 },
      { source: 'Google', count: 190 },
      { source: 'Twitter/X', count: 82 },
    ],
    dailyVisits: this.generateMockDailyVisits(),
  });

  readonly loading = signal(false);

  trackPageView(path: string): void {
    // Will integrate with backend analytics endpoint
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      navigator.sendBeacon(this.BACKEND_URL, JSON.stringify({ path, timestamp: Date.now() }));
    }
  }

  private generateMockDailyVisits(): { date: string; visits: number }[] {
    const visits: { date: string; visits: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      visits.push({
        date: date.toISOString().split('T')[0],
        visits: Math.floor(Math.random() * 80) + 20,
      });
    }
    return visits;
  }
}
