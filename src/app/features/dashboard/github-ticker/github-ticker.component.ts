import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

interface RawEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    commits?: { message: string }[];
    ref_type?: string;
    ref?: string;
    action?: string;
    pull_request?: { title: string; html_url: string };
    issue?: { title: string; html_url: string };
    forkee?: { full_name: string };
  };
}

interface TickerEvent {
  icon: string;
  text: string;
  repo: string;
  url: string;
  time: string;
}

const CACHE_KEY = 'portfolio_gh_ticker_v1';
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Live ticker scroller that pulls a developer's public GitHub events
 * and animates them across the screen. Falls back gracefully if the
 * GitHub API is rate-limited or offline. Cached for 5 minutes.
 */
@Component({
  selector: 'app-github-ticker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (events().length > 0) {
      <div class="ght" [attr.data-empty]="events().length === 0 ? 'true' : null" role="region" aria-label="Live GitHub activity">
        <div class="ght__label">
          <span class="ght__pulse" aria-hidden="true"></span>
          <span class="ght__label-text">LIVE · GitHub</span>
        </div>
        <div class="ght__viewport">
          <div class="ght__track">
            @for (e of doubled(); track $index) {
              <a class="ght__item" [href]="e.url" target="_blank" rel="noopener noreferrer">
                <span class="ght__icon" aria-hidden="true">{{ e.icon }}</span>
                <span class="ght__text">{{ e.text }}</span>
                <span class="ght__repo">{{ e.repo }}</span>
                <span class="ght__time">· {{ e.time }}</span>
              </a>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .ght {
      display: flex;
      align-items: stretch;
      gap: 0;
      background: linear-gradient(90deg,
        color-mix(in srgb, var(--accent) 8%, var(--card-bg)),
        var(--card-bg) 30%, var(--card-bg) 70%,
        color-mix(in srgb, var(--accent) 8%, var(--card-bg)));
      border-top: 1px solid var(--border, rgba(255,255,255,0.08));
      border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
      overflow: hidden;
      font-size: 0.82rem;
    }
    .ght__label {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px;
      background: var(--accent);
      color: #fff;
      font-weight: 700;
      letter-spacing: 0.05em;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .ght__pulse {
      width: 8px; height: 8px; border-radius: 50%;
      background: #fff;
      box-shadow: 0 0 0 0 rgba(255,255,255,0.7);
      animation: ghtPulse 1.6s ease-out infinite;
    }
    .ght__label-text { font-size: 0.72rem; }
    .ght__viewport {
      flex: 1;
      overflow: hidden;
      mask-image: linear-gradient(90deg, transparent, #000 30px, #000 calc(100% - 30px), transparent);
    }
    .ght__track {
      display: inline-flex;
      gap: 28px;
      padding: 8px 16px;
      animation: ghtScroll 50s linear infinite;
      white-space: nowrap;
    }
    .ght__viewport:hover .ght__track { animation-play-state: paused; }
    .ght__item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
      text-decoration: none;
      transition: color 0.2s;
    }
    .ght__item:hover { color: var(--accent); }
    .ght__icon { font-size: 1rem; }
    .ght__text { font-weight: 500; }
    .ght__repo { font-family: ui-monospace, SFMono-Regular, monospace; color: var(--accent); font-weight: 600; }
    .ght__time { color: var(--text-secondary); font-size: 0.74rem; }
    @keyframes ghtPulse {
      0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
      70%  { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
      100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
    }
    @keyframes ghtScroll {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .ght__track { animation: none; }
    }
  `],
})
export class GithubTickerComponent implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly events = signal<TickerEvent[]>([]);
  /** Duplicate so the marquee loop is seamless. */
  protected readonly doubled = computed(() => {
    const e = this.events();
    return e.length ? [...e, ...e] : [];
  });

  ngOnInit(): void {
    const cached = this.readCache();
    if (cached) { this.events.set(cached); return; }

    this.http.get<RawEvent[]>('https://api.github.com/users/Nandanhegde1/events/public?per_page=20')
      .pipe(catchError(() => of<RawEvent[]>([])))
      .subscribe(raw => {
        const mapped = raw.slice(0, 15).map(r => this.toTicker(r)).filter((e): e is TickerEvent => !!e);
        if (mapped.length) {
          this.events.set(mapped);
          this.writeCache(mapped);
        }
      });
  }

  private toTicker(e: RawEvent): TickerEvent | null {
    const repo = e.repo.name;
    const time = this.timeAgo(new Date(e.created_at));
    const url = `https://github.com/${repo}`;
    switch (e.type) {
      case 'PushEvent': {
        const commits = e.payload.commits?.length ?? 0;
        const last = e.payload.commits?.[0]?.message?.split('\n')[0] ?? '';
        // Some pushes (force-push, branch resets) report 0 commits in the public events feed.
        // Don't surface those — they read as confusing noise.
        if (commits === 0 || !last) return null;
        return { icon: '⚡', text: `Pushed ${commits} commit${commits === 1 ? '' : 's'}: "${this.truncate(last, 60)}"`, repo, url, time };
      }
      case 'CreateEvent':
        return { icon: '✨', text: `Created ${e.payload.ref_type ?? 'thing'}${e.payload.ref ? ' ' + e.payload.ref : ''}`, repo, url, time };
      case 'PullRequestEvent':
        return { icon: '🔀', text: `${e.payload.action ?? 'updated'} PR: "${this.truncate(e.payload.pull_request?.title ?? '', 60)}"`, repo, url: e.payload.pull_request?.html_url ?? url, time };
      case 'IssuesEvent':
        return { icon: '📋', text: `${e.payload.action ?? 'updated'} issue: "${this.truncate(e.payload.issue?.title ?? '', 60)}"`, repo, url: e.payload.issue?.html_url ?? url, time };
      case 'WatchEvent':
        return { icon: '⭐', text: 'Starred a repo', repo, url, time };
      case 'ForkEvent':
        return { icon: '🍴', text: `Forked → ${e.payload.forkee?.full_name ?? 'fork'}`, repo, url, time };
      case 'PublicEvent':
        return { icon: '🌍', text: 'Made repo public', repo, url, time };
      case 'ReleaseEvent':
        return { icon: '🚀', text: 'Released a new version', repo, url, time };
      default:
        return null;
    }
  }

  private truncate(s: string, n: number): string { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  private timeAgo(d: Date): string {
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  private readCache(): TickerEvent[] | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { ts, data } = JSON.parse(raw) as { ts: number; data: TickerEvent[] };
      if (Date.now() - ts > CACHE_TTL) return null;
      return data;
    } catch { return null; }
  }
  private writeCache(data: TickerEvent[]): void {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch { /* ignore */ }
  }
}
