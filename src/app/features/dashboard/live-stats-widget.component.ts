import { Component, inject, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { StatsService } from '../../core/services/stats.service';

@Component({
  selector: 'app-live-stats-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="live-stats">
      <div class="live-stats__header">
        <span class="live-stats__pulse" aria-hidden="true"></span>
        <h3>Live Portfolio Stats</h3>
        <span class="live-stats__sub">Real numbers · refreshed on load</span>
      </div>

      <div class="live-stats__grid">
        <!-- Visitors -->
        <div class="live-stats__card live-stats__card--visitor">
          <span class="live-stats__icon" aria-hidden="true">👁️</span>
          <span class="live-stats__value">{{ totalViews() }}</span>
          <span class="live-stats__label">page views</span>
          @if (topPages().length) {
            <ul class="live-stats__list">
              @for (p of topPages(); track p.path) {
                <li><span>{{ p.path }}</span><strong>{{ p.count }}</strong></li>
              }
            </ul>
          }
        </div>

        <!-- Recruiters -->
        <div class="live-stats__card live-stats__card--recruiter">
          <span class="live-stats__icon" aria-hidden="true">💼</span>
          <span class="live-stats__value">{{ stats.recruiter()?.total ?? 0 }}</span>
          <span class="live-stats__label">recruiter reach-outs</span>
          <span class="live-stats__delta">{{ stats.recruiter()?.last30Days ?? 0 }} in last 30 days</span>
          @if (recentRecruiters().length) {
            <ul class="live-stats__list">
              @for (r of recentRecruiters(); track r.company) {
                <li>
                  <span>{{ r.company }}</span>
                  <strong class="live-stats__role">{{ r.role || '—' }}</strong>
                </li>
              }
            </ul>
          }
        </div>

        <!-- Interviews -->
        <div class="live-stats__card live-stats__card--interview">
          <span class="live-stats__icon" aria-hidden="true">🎯</span>
          <span class="live-stats__value">{{ stats.interviews()?.total ?? 0 }}</span>
          <span class="live-stats__label">interviews logged</span>
          @if (interviewPipeline().length) {
            <div class="live-stats__pipeline">
              @for (s of interviewPipeline(); track s.stage) {
                <div class="live-stats__stage" [title]="s.stage + ': ' + s.count">
                  <span class="live-stats__stage-bar" [style.width.%]="s.pct"></span>
                  <span class="live-stats__stage-label">{{ s.stage }} · {{ s.count }}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>
      <p class="live-stats__footnote">All recruiter & interview data is real, logged from inbound contacts. Privacy-respected — no PII shown.</p>
    </div>
  `,
  styleUrl: './live-stats-widget.component.scss',
})
export class LiveStatsWidgetComponent implements OnInit {
  readonly stats = inject(StatsService);

  readonly totalViews = computed(() => this.stats.visitor()?.totalPageViews ?? 0);

  readonly topPages = computed(() => {
    const pages = this.stats.visitor()?.pages ?? {};
    return Object.entries(pages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([path, count]) => ({ path, count }));
  });

  readonly recentRecruiters = computed(() => this.stats.recruiter()?.recent?.slice(0, 4) ?? []);

  readonly interviewPipeline = computed(() => {
    const stages = this.stats.interviews()?.byStage ?? {};
    const total = Object.values(stages).reduce((a, b) => a + b, 0) || 1;
    const order = ['Applied', 'Phone', 'Technical', 'Onsite', 'Offer'];
    return order
      .filter((s) => stages[s])
      .map((s) => ({ stage: s, count: stages[s], pct: (stages[s] / total) * 100 }));
  });

  ngOnInit(): void {
    this.stats.loadAll();
  }
}
