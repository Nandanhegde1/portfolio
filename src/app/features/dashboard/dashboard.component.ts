import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AnimatedCounterComponent, LoadingSkeletonComponent } from '../../shared/components';
import { GitHubService } from '../../core/services';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { LiveStatsWidgetComponent } from './live-stats-widget.component';
import { GithubTickerComponent } from './github-ticker/github-ticker.component';
import { HireMeterWidgetComponent } from './hire-meter-widget.component';
import { StatsService } from '../../core/services/stats.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AnimatedCounterComponent, LoadingSkeletonComponent, ScrollRevealDirective, LiveStatsWidgetComponent, GithubTickerComponent, HireMeterWidgetComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dash">
      <div class="container">
        <!-- Header -->
        <div class="dash__header">
          <span class="dash__tag">// mission-control</span>
          <h1 class="dash__title">{{ 'dashboard.title' | transloco }}</h1>
          <p class="dash__subtitle">{{ 'dashboard.lede' | transloco }}</p>
        </div>

        <!-- Demo notice: this page is a UI playground; non-GitHub figures are sample data -->
        <div appScrollReveal style="margin:0 0 1.75rem;padding:.7rem 1rem;border:1px solid rgba(245,158,11,.45);background:rgba(245,158,11,.1);border-radius:10px;color:#fbbf24;font-size:.88rem;line-height:1.5;">
          ⚠️ <strong>Demo dashboard</strong> — a playground for UI &amp; animation ideas. The GitHub stats are live; the other figures (visits, vitals, hire-meter) are illustrative sample data, not real metrics.
        </div>

        <!-- Live GitHub Activity Ticker -->
        <div appScrollReveal>
          <app-github-ticker />
        </div>

        <!-- Hire-O-Meter (moved here from navbar) -->
        <div appScrollReveal>
          <app-hire-meter-widget />
        </div>

        <!-- Visitor Counter — hero (only shown once we have real data) -->
        @if (visitorCount() > 0) {
          <div class="dash__visitors" appScrollReveal>
            <div class="dash__visitors-glow"></div>
            <app-animated-counter [targetValue]="visitorCount()" size="lg" label="page views & counting" />
            <p class="dash__visitors-sub">Illustrative sample figure — not live traffic.</p>
          </div>
        }

        <!-- Live Stats Widget (real backend data) -->
        <div appScrollReveal>
          <app-live-stats-widget />
        </div>

        <!-- Code Vitals — "Health Monitor" -->
        <div class="dash__vitals" appScrollReveal>
          <h3 class="dash__section-title">
            <span class="dash__pulse"></span>
            Code Vitals
          </h3>
          <div class="dash__vitals-grid">
            @for (vital of codeVitals; track vital.label) {
              <div class="dash__vital-card">
                <span class="dash__vital-icon">{{ vital.icon }}</span>
                <app-animated-counter [targetValue]="vital.value" size="sm" />
                <span class="dash__vital-label">{{ vital.label }}</span>
                @if (vital.subtext) {
                  <span class="dash__vital-sub">{{ vital.subtext }}</span>
                }
              </div>
            }
          </div>
        </div>

        <!-- Tech Stack Orbit -->
        <div class="dash__orbit-section" appScrollReveal animation="scale">
          <h3 class="dash__section-title">Tech Ecosystem</h3>
          <div class="dash__orbit">
            <div class="dash__orbit-center">
              <span>&lt;NH/&gt;</span>
            </div>
            <div class="dash__orbit-ring dash__orbit-ring--1">
              @for (tech of innerOrbit; track tech.name) {
                <div class="dash__orbit-item" [style.--angle]="tech.angle + 'deg'" [title]="tech.name">
                  {{ tech.icon }}
                </div>
              }
            </div>
            <div class="dash__orbit-ring dash__orbit-ring--2">
              @for (tech of outerOrbit; track tech.name) {
                <div class="dash__orbit-item" [style.--angle]="tech.angle + 'deg'" [title]="tech.name">
                  {{ tech.icon }}
                </div>
              }
            </div>
          </div>
          <div class="dash__orbit-legend">
            @for (tech of allTech; track tech.name) {
              <span class="dash__orbit-tag">{{ tech.icon }} {{ tech.name }}</span>
            }
          </div>
        </div>

        <!-- Dev Fortune Cookie -->
        <div class="dash__fortune" appScrollReveal animation="scale" (click)="rollFortune()">
          <div class="dash__fortune-icon">🥠</div>
          <p class="dash__fortune-text" [class.dash__fortune-text--fading]="fortuneFading()">{{ currentFortune() }}</p>
          <span class="dash__fortune-hint">click for another · auto-rotates every 30s</span>
        </div>

        <!-- Hot Takes Ticker -->
        <div class="dash__ticker">
          <div class="dash__ticker-track">
            @for (take of hotTakes; track take) {
              <span class="dash__ticker-item">{{ take }}</span>
            }
            @for (take of hotTakes; track take; let i = $index) {
              <span class="dash__ticker-item" [attr.aria-hidden]="true">{{ take }}</span>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly github = inject(GitHubService);
  private readonly statsService = inject(StatsService);

  // Real visitor count from backend, falls back to a tasteful baseline while loading
  readonly visitorCount = computed(() => this.statsService.visitor()?.totalPageViews ?? 0);

  readonly codeVitals = [
    { icon: '⌨️', value: 127843, label: 'Lines Written', subtext: 'and counting...' },
    { icon: '🐛', value: 2341, label: 'Bugs Squashed', subtext: 'probably created more' },
    { icon: '☕', value: 1892, label: 'Coffees Consumed', subtext: 'fuel of champions' },
    { icon: '🔀', value: 4200, label: 'Git Commits', subtext: '"fix: fixed the fix"' },
    { icon: '⭐', value: 42, label: 'Stack Overflow Answers', subtext: 'helping the tribe' },
    { icon: '🌙', value: 47, label: 'All-Nighters', subtext: 'worth it... mostly' },
  ];

  readonly innerOrbit = [
    { name: 'Angular', icon: '🅰️', angle: 0 },
    { name: 'TypeScript', icon: '🔷', angle: 60 },
    { name: 'Node.js', icon: '💚', angle: 120 },
    { name: 'SCSS', icon: '🎨', angle: 180 },
    { name: 'RxJS', icon: '🔄', angle: 240 },
    { name: 'MongoDB', icon: '🍃', angle: 300 },
  ];

  readonly outerOrbit = [
    { name: 'AWS', icon: '☁️', angle: 30 },
    { name: 'Docker', icon: '🐳', angle: 75 },
    { name: 'Kubernetes', icon: '⎈', angle: 120 },
    { name: 'Terraform', icon: '🏗️', angle: 165 },
    { name: 'Jenkins', icon: '🔧', angle: 210 },
    { name: 'Azure', icon: '🔵', angle: 255 },
    { name: 'Three.js', icon: '🎮', angle: 300 },
    { name: 'GraphQL', icon: '◈', angle: 345 },
  ];

  readonly allTech = [...this.innerOrbit, ...this.outerOrbit];

  readonly hotTakes = [
    '💡 console.log is a perfectly valid debugging strategy',
    '🔥 CSS is absolutely a programming language',
    '⚡ Tabs > Spaces. Fight me.',
    '🎯 The best code is the code you don\'t write',
    '🧹 "I\'ll refactor it later" — narrator: he did not',
    '☕ First coffee, then code. Never the reverse.',
    '🐛 It\'s not a bug, it\'s an undocumented feature',
    '📦 node_modules is the heaviest object in the universe',
    '🚀 Works on my machine ™️',
    '💀 Who needs sleep when you have deadlines?',
  ];

  private readonly fortunes = [
    '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler',
    '"First, solve the problem. Then, write the code." — John Johnson',
    '"The best error message is the one that never shows up." — Thomas Fuchs',
    '"Code is like humor. When you have to explain it, it\'s bad." — Cory House',
    '"Simplicity is the soul of efficiency." — Austin Freeman',
    '"Make it work, make it right, make it fast." — Kent Beck',
    '"The only way to go fast is to go well." — Robert C. Martin',
    '"Talk is cheap. Show me the code." — Linus Torvalds',
    '"Programming isn\'t about what you know; it\'s about what you can figure out." — Chris Pine',
    '"Deleted code is debugged code." — Jeff Sickel',
  ];

  readonly currentFortune = signal(this.fortunes[0]);
  readonly fortuneFading = signal(false);
  private fortuneInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.github.fetchAll('Nandanhegde1');
    this.statsService.loadAll();
    this.rollFortune();
    this.fortuneInterval = setInterval(() => this.rollFortune(), 30000);
  }

  ngOnDestroy(): void {
    if (this.fortuneInterval) {
      clearInterval(this.fortuneInterval);
    }
  }

  rollFortune(): void {
    this.fortuneFading.set(true);
    setTimeout(() => {
      const current = this.currentFortune();
      let next = current;
      while (next === current) {
        next = this.fortunes[Math.floor(Math.random() * this.fortunes.length)];
      }
      this.currentFortune.set(next);
      this.fortuneFading.set(false);
    }, 300);
  }
}
