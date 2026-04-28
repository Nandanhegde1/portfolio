import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EngagementService } from '../../core/services';

interface TierStop {
  at: number;
  label: string;
  color: string;
  emoji: string;
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
        <h3 class="hm__title">Your Hire-O-Meter</h3>
        <span class="hm__sub">A score of how much you've explored — purely for fun.</span>
      </header>

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
            Explored <strong>{{ engagement.visitedCount() }}</strong> of {{ totalSections }} sections.
            @if (engagement.score() < 100) {
              Visit a few more pages to climb tiers — no signup, no ads, just curiosity.
            } @else {
              You've seen it all. The contact form is one click away 😎
            }
          </p>
          <a routerLink="/contact" class="hm__cta">
            @if (engagement.score() >= 75) { Let&rsquo;s talk &rarr; } @else { See contact &rarr; }
          </a>
        </div>
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
    @keyframes hmPulse {
      0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 70%, transparent); }
      70%  { box-shadow: 0 0 0 10px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
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
  protected readonly totalSections = 8;

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
