import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EngagementService } from '../../core/services';

interface TierStop {
  at: number;
  label: string;
  color: string;
  emoji: string;
}

interface SectionItem {
  path: string;
  label: string;
  icon: string;
  points: number;
}

@Component({
  selector: 'app-hire-meter-widget',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hm">
      <header class="hm__header">
        <span class="hm__pulse" aria-hidden="true"></span>
        <h3 class="hm__title">Exploration Score</h3>
        <button
          type="button"
          class="hm__info-btn"
          [attr.aria-expanded]="infoOpen()"
          (click)="infoOpen.set(!infoOpen())"
          aria-label="What is this?"
        >?</button>
        <span class="hm__sub">A friendly nudge to explore — no signup, no tracking, all in your browser.</span>
      </header>

      @if (infoOpen()) {
        <div class="hm__info-panel" role="region" aria-label="How the score works">
          <p class="hm__info-line"><strong>What is this?</strong> A score that grows as you visit different sections of this portfolio. It's a fun way to see how thoroughly you've explored my work — and a hint to me about which pages people actually find useful.</p>
          <p class="hm__info-line"><strong>How it works:</strong> Each section is worth points (shown below). Points are stored only in your browser via <code>localStorage</code>. No account, no cookies, no server.</p>
          <p class="hm__info-line"><strong>Why bother?</strong> Hit 75+ and the contact CTA pre-fills with a context-aware message. Hit 90+ and you've officially seen everything that makes me hireable.</p>
        </div>
      }

      <div class="hm__main">
        <div class="hm__ring-wrap">
          <svg viewBox="0 0 120 120" class="hm__ring" aria-hidden="true">
            <circle cx="60" cy="60" r="52" class="hm__ring-bg"/>
            <circle cx="60" cy="60" r="52" class="hm__ring-fg"
                    [attr.stroke]="engagement.tier().color"
                    [attr.stroke-dasharray]="dashArray()"/>
          </svg>
          <div class="hm__ring-center">
            <span class="hm__score" [style.color]="engagement.tier().color">{{ engagement.score() }}</span>
            <span class="hm__score-max">/ 100</span>
          </div>
        </div>

        <div class="hm__body">
          <div class="hm__tier" [style.color]="engagement.tier().color">{{ engagement.tier().label }}</div>
          <p class="hm__msg">
            You've explored <strong>{{ engagement.visitedCount() }}</strong> of {{ totalSections }} sections.
            @if (engagement.score() < 100) {
              {{ remainingHint() }}
            } @else {
              You've seen it all. The contact form is one click away 😎
            }
          </p>
          <a routerLink="/contact" class="hm__cta">
            @if (engagement.score() >= 75) { Let&rsquo;s talk &rarr; } @else { See contact &rarr; }
          </a>
        </div>
      </div>

      <!-- Section checklist: show what counts toward the score and what's left -->
      <div class="hm__checklist-wrap">
        <div class="hm__checklist-label">Sections that count</div>
        <ul class="hm__checklist" aria-label="Sections explored">
          @for (s of sections; track s.path) {
            <li class="hm__check-item" [class.hm__check-item--done]="visited().has(s.path)">
              <span class="hm__check-mark" aria-hidden="true">{{ visited().has(s.path) ? '✓' : '○' }}</span>
              <a [routerLink]="s.path" class="hm__check-link">
                <span class="hm__check-icon" aria-hidden="true">{{ s.icon }}</span>
                <span class="hm__check-name">{{ s.label }}</span>
              </a>
              <span class="hm__check-pts">+{{ s.points }}</span>
            </li>
          }
        </ul>
      </div>

      <ol class="hm__tiers" aria-label="Tier progression">
        @for (t of tiers; track t.at) {
          <li class="hm__tier-step"
              [class.hm__tier-step--reached]="engagement.score() >= t.at"
              [style.--tier-color]="t.color">
            <span class="hm__tier-emoji">{{ t.emoji }}</span>
            <span class="hm__tier-label">{{ t.label }}</span>
            <span class="hm__tier-at">{{ t.at }}+</span>
          </li>
        }
      </ol>
    </div>
  `,
  styles: [`
    .hm {
      padding: 1.5rem;
      background: var(--card-bg);
      border: 1px solid var(--border, rgba(255,255,255,0.08));
      border-radius: 16px;
    }
    .hm__header {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }
    .hm__title { margin: 0; font-size: 1.15rem; font-weight: 700; }
    .hm__sub { color: var(--text-secondary); font-size: 0.85rem; flex-basis: 100%; }
    .hm__pulse {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 70%, transparent);
      animation: hmPulse 1.6s ease-out infinite;
    }
    .hm__info-btn {
      width: 22px; height: 22px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-secondary);
      font-weight: 800;
      font-size: 0.78rem;
      line-height: 1;
      cursor: pointer;
      transition: all 0.18s ease;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .hm__info-btn:hover,
    .hm__info-btn[aria-expanded="true"] {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
      transform: scale(1.05);
    }
    .hm__info-panel {
      margin: 0 0 1.25rem;
      padding: 12px 14px;
      background: color-mix(in srgb, var(--accent) 6%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--border));
      border-radius: 10px;
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.55;
      animation: hmFadeIn 0.2s ease;
    }
    .hm__info-line { margin: 0 0 0.5rem; }
    .hm__info-line:last-child { margin-bottom: 0; }
    .hm__info-line strong { color: var(--text-primary); font-weight: 700; }
    .hm__info-line code {
      font-family: ui-monospace, monospace;
      font-size: 0.85em;
      padding: 1px 5px;
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      border-radius: 3px;
      color: var(--accent);
    }
    @keyframes hmPulse {
      0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 70%, transparent); }
      70%  { box-shadow: 0 0 0 10px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }
    @keyframes hmFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hm__main {
      display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;
    }
    .hm__ring-wrap {
      position: relative;
      width: 140px; height: 140px;
      flex-shrink: 0;
    }
    .hm__ring { width: 100%; height: 100%; transform: rotate(-90deg); }
    .hm__ring-bg { fill: none; stroke: color-mix(in srgb, var(--text-secondary) 20%, transparent); stroke-width: 8; }
    .hm__ring-fg {
      fill: none; stroke-width: 8; stroke-linecap: round;
      transition: stroke-dasharray 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .hm__ring-center {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 2px;
    }
    .hm__score { font-size: 2.4rem; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
    .hm__score-max { font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; }
    .hm__body { flex: 1; min-width: 240px; }
    .hm__tier { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.4rem; }
    .hm__msg { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.55; margin: 0 0 0.85rem; }
    .hm__cta {
      display: inline-block;
      padding: 8px 18px;
      background: var(--accent);
      color: #fff;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .hm__cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 22px color-mix(in srgb, var(--accent) 40%, transparent);
    }

    /* Section checklist */
    .hm__checklist-wrap { margin-top: 1.5rem; }
    .hm__checklist-label {
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-secondary);
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .hm__checklist {
      list-style: none;
      padding: 0; margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 6px;
    }
    .hm__check-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--text-secondary) 6%, transparent);
      border: 1px solid transparent;
      font-size: 0.82rem;
      transition: all 0.2s ease;
    }
    .hm__check-item--done {
      background: color-mix(in srgb, var(--accent) 10%, transparent);
      border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    }
    .hm__check-mark {
      flex-shrink: 0;
      width: 18px; height: 18px;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 50%;
      font-weight: 800;
      font-size: 0.78rem;
      color: var(--text-secondary);
    }
    .hm__check-item--done .hm__check-mark {
      background: var(--accent);
      color: #fff;
    }
    .hm__check-link {
      flex: 1;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-primary);
      text-decoration: none;
      font-weight: 500;
      min-width: 0;
    }
    .hm__check-link:hover { color: var(--accent); }
    .hm__check-icon { font-size: 1rem; line-height: 1; }
    .hm__check-name {
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .hm__check-pts {
      font-family: ui-monospace, monospace;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-secondary);
      flex-shrink: 0;
    }
    .hm__check-item--done .hm__check-pts { color: var(--accent); }

    .hm__tiers {
      list-style: none; padding: 0; margin: 1.5rem 0 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 8px;
    }
    .hm__tier-step {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 10px 6px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--text-secondary) 8%, transparent);
      opacity: 0.4;
      transition: all 0.3s;
      text-align: center;
    }
    .hm__tier-step--reached {
      opacity: 1;
      background: color-mix(in srgb, var(--tier-color) 15%, transparent);
      border: 1px solid color-mix(in srgb, var(--tier-color) 40%, transparent);
      transform: translateY(-2px);
    }
    .hm__tier-emoji { font-size: 1.3rem; }
    .hm__tier-label { font-size: 0.7rem; font-weight: 700; color: var(--tier-color, var(--text-primary)); }
    .hm__tier-at { font-family: ui-monospace, monospace; font-size: 0.65rem; color: var(--text-secondary); }
  `],
})
export class HireMeterWidgetComponent {
  protected readonly engagement = inject(EngagementService);
  protected readonly infoOpen = signal(false);

  // Mirror of EngagementService.weights — kept here for the visible checklist.
  // If you change weights in the service, update this list too.
  protected readonly sections: SectionItem[] = [
    { path: '/',          label: 'Home',       icon: '🏠', points: 10 },
    { path: '/about',     label: 'About',      icon: '👤', points: 20 },
    { path: '/dashboard', label: 'Dashboard',  icon: '📊', points: 20 },
    { path: '/blog',      label: 'Blog',       icon: '✍️', points: 15 },
    { path: '/roast',     label: 'Roast',      icon: '🔥', points: 10 },
    { path: '/quiz',      label: 'Quiz',       icon: '🎯', points: 10 },
    { path: '/guestbook', label: 'Guestbook',  icon: '📖', points: 8  },
    { path: '/contact',   label: 'Contact',    icon: '📬', points: 7  },
  ];

  protected readonly totalSections = this.sections.length;

  protected readonly visited = computed(
    () => new Set(this.engagement.visits().map((v) => v.path))
  );

  /** Suggest the next-highest-value unvisited section to climb the score fastest. */
  protected readonly remainingHint = computed(() => {
    const seen = this.visited();
    const next = [...this.sections]
      .filter((s) => !seen.has(s.path))
      .sort((a, b) => b.points - a.points)[0];
    return next
      ? `Next up: visit ${next.label} (+${next.points} pts) to climb tiers.`
      : 'You\'re one section away from Legend.';
  });

  protected readonly tiers: TierStop[] = [
    { at: 0,  label: 'New here',  color: '#94a3b8', emoji: '👋' },
    { at: 25, label: 'Browsing', color: '#10b981', emoji: '👀' },
    { at: 50, label: 'Curious',  color: '#6c63ff', emoji: '✨' },
    { at: 75, label: 'On fire',  color: '#f43f5e', emoji: '🔥' },
    { at: 90, label: 'Legend',   color: '#fbbf24', emoji: '🏆' },
  ];

  protected readonly dashArray = computed(() => {
    const circumference = 2 * Math.PI * 52;
    const filled = (this.engagement.score() / 100) * circumference;
    return `${filled} ${circumference}`;
  });
}
