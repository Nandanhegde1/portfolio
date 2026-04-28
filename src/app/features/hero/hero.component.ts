import { Component, inject, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioDataService, GitHubService } from '../../core/services';
import { ThreeSceneComponent } from './three-scene/three-scene.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ThreeSceneComponent, RouterLink, TimeAgoPipe, MagneticDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      @defer (on viewport; prefetch on idle) {
        <app-three-scene />
      } @placeholder {
        <div class="hero__particles-fallback" aria-hidden="true">
          @for (i of skeletonDots; track $index) {
            <span class="hero__particles-fallback-dot" [style.--i]="$index"></span>
          }
        </div>
      } @loading (minimum 200ms) {
        <div class="hero__particles-fallback hero__particles-fallback--loading" aria-hidden="true"></div>
      }
      <div class="hero__content">
        <span class="hero__greeting">{{ greeting() }} I'm</span>
        <h1 class="hero__name">{{ portfolioData.data()?.personal?.name ?? 'Nandan Hegde' }}</h1>
        <div class="hero__title-wrapper">
          <span class="hero__title">{{ portfolioData.data()?.personal?.title ?? 'Full Stack Developer' }}</span>
          <span class="hero__cursor">|</span>
        </div>
        <p class="hero__tagline">{{ portfolioData.data()?.personal?.tagline ?? '' }}</p>
        <div class="hero__actions">
          <a routerLink="/about" class="btn btn--primary" appMagnetic>About Me</a>
          <a routerLink="/contact" class="btn btn--outline" appMagnetic>Get in Touch</a>
          <a routerLink="/about" fragment="resume" class="btn btn--ghost" appMagnetic>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Resume
          </a>
        </div>

        @if (github.mostRecentRepo(); as r) {
          <a [href]="r.html_url" target="_blank" rel="noopener" class="hero__activity">
            <span class="hero__activity-pulse" aria-hidden="true"></span>
            <span class="hero__activity-text">
              Currently shipping <strong>{{ r.name }}</strong>
              <span class="hero__activity-meta">· updated {{ r.updated_at | timeAgo }}</span>
            </span>
          </a>
        }
      </div>
      <div class="hero__scroll-hint">
        <span class="hero__scroll-label">Scroll</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </div>
    </section>
  `,
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnInit {
  readonly portfolioData = inject(PortfolioDataService);
  readonly github = inject(GitHubService);

  // Static array used by the CSS skeleton placeholder while Three.js loads.
  readonly skeletonDots = Array.from({ length: 30 });

  // Time-aware greeting that adapts to visitor's local hour
  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning, you’re up early.';
    if (h >= 12 && h < 17) return 'Good afternoon. Glad you’re here.';
    if (h >= 17 && h < 21) return 'Evening! Welcome.';
    if (h >= 21 || h < 1) return 'Working late? Same.';
    return 'It’s late. Coffee?';
  });

  ngOnInit(): void {
    if (!this.portfolioData.data()) {
      this.portfolioData.loadData();
    }
    if (!this.github.repos().length) {
      this.github.fetchAll('Nandanhegde1');
    }
  }
}
