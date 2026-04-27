import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioDataService } from '../../core/services';
import { ThreeSceneComponent } from './three-scene/three-scene.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ThreeSceneComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      @defer (on viewport) {
        <app-three-scene />
      } @placeholder {
        <div class="hero__particles-fallback"></div>
      }
      <div class="hero__content">
        <span class="hero__greeting">Hello, I'm</span>
        <h1 class="hero__name">{{ portfolioData.data()?.personal?.name ?? 'Nandan Hegde' }}</h1>
        <div class="hero__title-wrapper">
          <span class="hero__title">{{ portfolioData.data()?.personal?.title ?? 'Full Stack Developer' }}</span>
          <span class="hero__cursor">|</span>
        </div>
        <p class="hero__tagline">{{ portfolioData.data()?.personal?.tagline ?? '' }}</p>
        <div class="hero__actions">
          <a routerLink="/about" class="btn btn--primary">About Me</a>
          <a routerLink="/contact" class="btn btn--outline">Get in Touch</a>
          <a href="/assets/resume.pdf" target="_blank" rel="noopener" class="btn btn--ghost">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Resume
          </a>
        </div>
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

  ngOnInit(): void {
    if (!this.portfolioData.data()) {
      this.portfolioData.loadData();
    }
  }
}
