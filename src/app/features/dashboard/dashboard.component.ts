import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { AnimatedCounterComponent, LoadingSkeletonComponent } from '../../shared/components';
import { GitHubService } from '../../core/services';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AnimatedCounterComponent, LoadingSkeletonComponent, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dash">
      <div class="container">
        <!-- Header -->
        <div class="dash__header">
          <span class="dash__tag">// mission-control</span>
          <h1 class="dash__title">Developer Dashboard</h1>
          <p class="dash__subtitle">Real-time stats, because developers love data.</p>
        </div>

        <!-- Visitor Counter — Hero -->
        <div class="dash__visitors" appScrollReveal>
          <div class="dash__visitors-glow"></div>
          <app-animated-counter [targetValue]="visitorCount" size="lg" label="visitors & counting" />
          <p class="dash__visitors-sub">People who've checked out this portfolio</p>
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

        <!-- GitHub Heatmap -->
        <div class="dash__card" appScrollReveal>
          <h3 class="dash__section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            Contribution Graph
          </h3>
          @if (github.loading()) {
            <app-loading-skeleton />
          } @else {
            @if (github.stats(); as stats) {
              <div class="heatmap">
                <div class="heatmap__grid">
                  @for (day of stats.contributionData; track day.date) {
                    <div
                      class="heatmap__cell"
                      [attr.data-level]="day.level"
                      [title]="day.count + ' contributions on ' + day.date"
                    ></div>
                  }
                </div>
                <div class="heatmap__legend">
                  <span>Less</span>
                  <div class="heatmap__cell" data-level="0"></div>
                  <div class="heatmap__cell" data-level="1"></div>
                  <div class="heatmap__cell" data-level="2"></div>
                  <div class="heatmap__cell" data-level="3"></div>
                  <div class="heatmap__cell" data-level="4"></div>
                  <span>More</span>
                </div>
              </div>
            }
          }
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

  readonly visitorCount = 250;

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
    this.github.fetchAll('nandanhegde');
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
