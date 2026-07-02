import {
  Component, ChangeDetectionStrategy, signal,
  AfterViewInit, OnDestroy, ElementRef, viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';

interface PitchStat {
  value: number;
  suffix: string;
  label: string;
}

interface ValueProp {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-pitch',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pitch" #pitchContainer>
      <!-- Scene 1: Opening -->
      <section class="pitch__scene pitch__scene--opening">
        <div class="pitch__scene-inner">
          <p class="pitch__eyebrow">NANDAN HEGDE</p>
          <h1 class="pitch__hero-text">
            <span class="pitch__hero-line">6+ years.</span>
            <span class="pitch__hero-line">10,000+ users.</span>
            <span class="pitch__hero-line pitch__hero-line--accent">1 mission.</span>
          </h1>
          <p class="pitch__hero-sub">I build full-stack products — and the AI inside them — that hold up when thousands of people rely on them.</p>
          <div class="pitch__scroll-hint">
            <span>Scroll to explore</span>
            <div class="pitch__scroll-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- Scene 2: Stats -->
      <section class="pitch__scene pitch__scene--stats" #statsScene>
        <div class="pitch__scene-inner">
          <p class="pitch__eyebrow">BY THE NUMBERS</p>
          <div class="pitch__stats-grid">
            @for (stat of stats; track stat.label) {
              <div class="pitch__stat-block">
                <span class="pitch__stat-value" [attr.data-target]="stat.value">
                  {{ getAnimatedValue(stat) }}{{ stat.suffix }}
                </span>
                <span class="pitch__stat-label">{{ stat.label }}</span>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Scene 3: Journey -->
      <section class="pitch__scene pitch__scene--journey">
        <div class="pitch__scene-inner">
          <p class="pitch__eyebrow">THE JOURNEY</p>
          <div class="pitch__journey-track">
            <div class="pitch__journey-line"></div>
            <div class="pitch__journey-node">
              <div class="pitch__journey-dot"></div>
              <div class="pitch__journey-card">
                <span class="pitch__journey-year">2020</span>
                <h3>Started at Infosys</h3>
                <p>Built enterprise-grade apps for Swiss Re. Learned what "scale" really means.</p>
              </div>
            </div>
            <div class="pitch__journey-node pitch__journey-node--right">
              <div class="pitch__journey-dot"></div>
              <div class="pitch__journey-card">
                <span class="pitch__journey-year">2021</span>
                <h3>AWS Certified</h3>
                <p>Solutions Architect Associate. Cloud-first thinking, infrastructure as code.</p>
              </div>
            </div>
            <div class="pitch__journey-node">
              <div class="pitch__journey-dot"></div>
              <div class="pitch__journey-card">
                <span class="pitch__journey-year">2022</span>
                <h3>Joined Thinkbridge</h3>
                <p>Senior Engineer leading the AI workstream — an AI voice-interview + fit-scoring system and a candidate-ranking engine — on a 10,000-user recruiting platform.</p>
              </div>
            </div>
            <div class="pitch__journey-node pitch__journey-node--right">
              <div class="pitch__journey-dot"></div>
              <div class="pitch__journey-card">
                <span class="pitch__journey-year">Now</span>
                <h3>What's next?</h3>
                <p>Ready to lead AI-product work at a bigger scale — open to senior and lead roles abroad.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Scene 4: Value Props -->
      <section class="pitch__scene pitch__scene--value">
        <div class="pitch__scene-inner">
          <p class="pitch__eyebrow">WHAT I BRING</p>
          <h2 class="pitch__value-heading">Three things that make the difference.</h2>
          <div class="pitch__value-grid">
            @for (prop of valueProps; track prop.title) {
              <div class="pitch__value-card">
                <div class="pitch__value-icon">{{ prop.icon }}</div>
                <h3 class="pitch__value-title">{{ prop.title }}</h3>
                <p class="pitch__value-desc">{{ prop.description }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Scene 5: Stack -->
      <section class="pitch__scene pitch__scene--stack">
        <div class="pitch__scene-inner">
          <p class="pitch__eyebrow">THE TOOLKIT</p>
          <div class="pitch__stack-cloud">
            @for (tech of techStack; track tech) {
              <span
                class="pitch__stack-tag"
                [style.animation-delay]="($index * 60) + 'ms'"
                [class.pitch__stack-tag--primary]="isPrimary(tech)"
              >{{ tech }}</span>
            }
          </div>
        </div>
      </section>

      <!-- Scene 6: CTA -->
      <section class="pitch__scene pitch__scene--cta">
        <div class="pitch__scene-inner">
          <h2 class="pitch__cta-text">Let\u2019s build something.</h2>
          <p class="pitch__cta-sub">I\u2019m open to senior and lead roles in full-stack and AI product.</p>
          <div class="pitch__cta-buttons">
            <a routerLink="/contact" class="pitch__cta-btn pitch__cta-btn--primary">
              Get in Touch
            </a>
            <a href="https://linkedin.com/in/nandanhegde1096" target="_blank" rel="noopener" class="pitch__cta-btn pitch__cta-btn--secondary">
              LinkedIn
            </a>
          </div>
          <p class="pitch__cta-or">or read the <a routerLink="/case-study/ai-interview">AI interview case study</a> · explore the <a routerLink="/">full portfolio</a></p>
        </div>
      </section>
    </div>
  `,
  styleUrl: './pitch.component.scss',
})
export class PitchComponent implements AfterViewInit, OnDestroy {
  private readonly pitchRef = viewChild<ElementRef<HTMLDivElement>>('pitchContainer');
  private readonly statsRef = viewChild<ElementRef<HTMLElement>>('statsScene');
  private observer?: IntersectionObserver;
  readonly statsVisible = signal(false);
  private animationFrame = 0;
  private animStart = 0;
  private readonly animDuration = 2000;
  readonly animatedStats = signal<number[]>([0, 0, 0, 0, 0, 0]);

  readonly stats: PitchStat[] = [
    { value: 6, suffix: '+', label: 'Years Experience' },
    { value: 10000, suffix: '+', label: 'Platform Users' },
    { value: 10, suffix: '+', label: 'Engineers Led' },
    { value: 3, suffix: '', label: 'Cloud Platforms' },
    { value: 1, suffix: '', label: 'AWS Certification' },
    { value: 12, suffix: '+', label: 'Projects Delivered' },
  ];

  readonly valueProps: ValueProp[] = [
    {
      icon: '\u26A1',
      title: 'I Ship Fast, Cleanly',
      description: 'I don\u2019t just write code that works \u2014 I write code the next developer thanks me for. AngularJS\u2192Angular 19 migration, CI/CD, LLM integration in production \u2014 all shipped.',
    },
    {
      icon: '\uD83E\uDDE9',
      title: 'I Think in Systems',
      description: 'From LLM systems to design systems, I see the big picture \u2014 I architect the AI (voice-interview + fit-scoring, retrieval and ranking, a model-cost strategy) and the product it lives in.',
    },
    {
      icon: '\uD83E\uDD1D',
      title: 'I Multiply Teams',
      description: 'Leading a ~10-engineer team, running design and code reviews, and driving Claude adoption across 30+ engineers \u2014 I make the people around me better. That\u2019s the multiplier effect recruiters look for.',
    },
  ];

  readonly techStack = [
    'Angular 19', 'TypeScript', 'RxJS', 'SCSS', 'Node.js', 'Express',
    'MongoDB', 'Azure', 'AWS', 'GCP', 'Docker', 'Kubernetes',
    'Terraform', 'Jenkins', 'Three.js', 'PowerBI', 'Git', 'REST APIs',
    'GraphQL', 'CI/CD', 'Agile', 'JIRA',
  ];

  private readonly primaryTech = new Set(['Angular 19', 'TypeScript', 'RxJS', 'SCSS', 'Node.js', 'Azure']);

  ngAfterViewInit(): void {
    this.setupScrollAnimations();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }

  isPrimary(tech: string): boolean {
    return this.primaryTech.has(tech);
  }

  getAnimatedValue(stat: PitchStat): number {
    const idx = this.stats.indexOf(stat);
    return this.animatedStats()[idx] ?? 0;
  }

  private animateCounters(): void {
    this.animStart = performance.now();
    const tick = (now: number) => {
      const elapsed = now - this.animStart;
      const progress = Math.min(elapsed / this.animDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.animatedStats.set(
        this.stats.map(s => Math.round(eased * s.value))
      );
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(tick);
      }
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  private setupScrollAnimations(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('pitch__scene--visible');
            if (entry.target.classList.contains('pitch__scene--stats')) {
              this.statsVisible.set(true);
              this.animateCounters();
            }
          }
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    const pitchEl = this.pitchRef()?.nativeElement;
    if (pitchEl) {
      const scenes = pitchEl.querySelectorAll('.pitch__scene');
      scenes.forEach(scene => this.observer!.observe(scene));
    }
  }
}
