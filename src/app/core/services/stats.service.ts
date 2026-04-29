import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisitorStats {
  totalPageViews: number;
  pages: Record<string, number>;
}

export interface RecruiterStats {
  total: number;
  last30Days: number;
  byCompany: Record<string, number>;
  recent: { company: string; role: string; contacted_at: string; source?: string }[];
}

export interface InterviewStats {
  total: number;
  byStage: Record<string, number>;
  byOutcome: Record<string, number>;
  recent: { company: string; stage: string; outcome: string; interview_date: string }[];
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  readonly visitor = signal<VisitorStats | null>(null);
  readonly recruiter = signal<RecruiterStats | null>(null);
  readonly interviews = signal<InterviewStats | null>(null);
  readonly loading = signal(false);

  async loadAll(): Promise<void> {
    this.loading.set(true);
    const [v, r, i] = await Promise.allSettled([
      firstValueFrom(this.http.get<VisitorStats>(`${this.base}/api/analytics/stats`)),
      firstValueFrom(this.http.get<RecruiterStats>(`${this.base}/api/recruiter/stats`)),
      firstValueFrom(this.http.get<InterviewStats>(`${this.base}/api/interviews/stats`)),
    ]);
    if (v.status === 'fulfilled') this.visitor.set(v.value);
    if (r.status === 'fulfilled') this.recruiter.set(r.value);
    if (i.status === 'fulfilled') this.interviews.set(i.value);
    this.loading.set(false);
  }

  /** Fire-and-forget page view ping. */
  trackPageView(path: string): void {
    this.http.post(`${this.base}/api/analytics`, { path }).subscribe({ error: () => { /* analytics is best-effort */ } });
  }
}
