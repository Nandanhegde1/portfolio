import {
  Component, ChangeDetectionStrategy
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroComponent } from '../hero/hero.component';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { AnimatedCounterComponent } from '../../shared/components';

interface HomeStat {
  value: number;
  suffix: string;
  label: string;
  icon: string;
}

interface JourneyNode {
  year: string;
  title: string;
  description: string;
  side: 'left' | 'right';
}

interface FeaturedProject {
  title: string;
  client: string;
  oneLiner: string;
  metric: string;
  stack: string[];
  link: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, RouterLink, ScrollRevealDirective, AnimatedCounterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero />

    <!-- Bento Grid -->
    <section class="bento">
      <div class="bento__inner">

        <!-- Row 1: Identity (compact) -->
        <div class="bento__card bento__card--name" appScrollReveal>
          <span class="bento__card-tag">// hello-world</span>
          <h2 class="bento__name">Nandan Hegde</h2>
          <p class="bento__role">Senior Full-Stack Engineer · AI Products</p>
          <p class="bento__guild">Thinkbridge · PSG Global Solutions</p>
          <div class="bento__available">
            <span class="bento__pulse"></span>
            Open to opportunities
          </div>
        </div>

        <!-- Row 2: 3 best projects (full width) — the work leads, the gimmicks follow -->
        <div class="bento__card bento__card--projects" appScrollReveal [delay]="80">
          <span class="bento__card-tag">// shipped · production</span>
          <h3 class="bento__projects-title">Three things I built that actually run</h3>
          <div class="bento__projects-grid">
            @for (p of featuredProjects; track p.title) {
              <a [routerLink]="p.link" class="bento__project">
                <div class="bento__project-head">
                  <h4 class="bento__project-title">{{ p.title }}</h4>
                  <span class="bento__project-client">{{ p.client }}</span>
                </div>
                <p class="bento__project-line">{{ p.oneLiner }}</p>
                <div class="bento__project-metric">{{ p.metric }}</div>
                <div class="bento__project-stack">
                  @for (s of p.stack; track s) {
                    <span>{{ s }}</span>
                  }
                </div>
              </a>
            }
          </div>
          <a routerLink="/projects" class="bento__projects-link">See all projects →</a>
        </div>

        <!-- Row 3: Stats + Stack (combined) -->
        <div class="bento__card bento__card--status" appScrollReveal [delay]="120">
          <div class="bento__status-grid">
            @for (stat of stats; track stat.label) {
              <div class="bento__stat">
                <span class="bento__stat-icon">{{ stat.icon }}</span>
                <div class="bento__stat-content">
                  <div class="bento__stat-value">
                    <app-animated-counter [targetValue]="stat.value" size="md" />
                    <span class="bento__stat-suffix">{{ stat.suffix }}</span>
                  </div>
                  <span class="bento__stat-label">{{ stat.label }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="bento__card bento__card--stack" appScrollReveal [delay]="160">
          <span class="bento__card-tag">// tech-stack</span>
          <div class="bento__stack-cloud">
            @for (tech of techStack; track tech.name) {
              <span
                class="bento__stack-tag"
                [class.bento__stack-tag--primary]="tech.primary"
              >{{ tech.name }}</span>
            }
          </div>
        </div>

        <!-- Row 4: Roast My Stack — the AI experiment, after the real work -->
        <a routerLink="/lab" class="bento__card bento__card--roast-hero" appScrollReveal [delay]="200">
          <div class="bento__roast-hero-bg" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </div>
          <div class="bento__roast-hero-content">
            <span class="bento__roast-hero-eyebrow">// the lab · ai experiment</span>
            <h3 class="bento__roast-hero-title">
              <span class="bento__roast-hero-emoji">🔥</span>
              Roast My Tech Stack
            </h3>
            <p class="bento__roast-hero-desc">
              Drop your stack. Claude roasts it in three intensities. Source linked.
              The system prompt took 3 rewrites — the first version only generated compliments.
            </p>
            <span class="bento__roast-hero-cta">Open the lab →</span>
          </div>
        </a>

        <!-- Row 5: Journey timeline (full width) -->
        <div class="bento__card bento__card--journey" appScrollReveal [delay]="240">
          <span class="bento__card-tag">// journey</span>
          <div class="bento__timeline">
            @for (node of journey; track node.year + node.title) {
              <div class="bento__timeline-node">
                <span class="bento__timeline-year">{{ node.year }}</span>
                <div class="bento__timeline-dot"></div>
                <div class="bento__timeline-info">
                  <h4>{{ node.title }}</h4>
                  <p>{{ node.description }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Row 6: Single CTA -->
        <div class="bento__card bento__card--cta" appScrollReveal [delay]="280">
          <h2 class="bento__cta-text">Got a project? Let's talk shop.</h2>
          <p class="bento__cta-sub">Senior and lead full-stack / AI-product roles. Or just say hi.</p>
          <div class="bento__cta-buttons">
            <a routerLink="/contact" class="bento__cta-btn bento__cta-btn--primary">
              Get in Touch
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a routerLink="/roast-me-back" class="bento__cta-btn bento__cta-btn--secondary">Or roast me back</a>
          </div>
        </div>

      </div>
    </section>
  `,
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly stats: HomeStat[] = [
    { value: 6, suffix: '+', label: 'Years Experience', icon: '\u26A1' },
    { value: 15, suffix: '+', label: 'Features Shipped', icon: '\uD83D\uDE80' },
    { value: 10, suffix: 'K+', label: 'Users Served', icon: '\uD83D\uDC65' },
    { value: 5, suffix: 'K+', label: 'Test Lines Written', icon: '\u2705' },
  ];

  readonly featuredProjects: FeaturedProject[] = [
    {
      title: 'AI Interview & Fit-Scoring (Anna)',
      client: 'PSG Global Solutions',
      oneLiner: 'An AI voice agent interviews each candidate; the transcript is scored into a fit score against the role.',
      metric: '10K+ user platform · demoed live in Austin',
      stack: ['LLMs', 'Azure OpenAI', 'Voice AI', 'FastAPI'],
      link: '/case-study/ai-interview',
    },
    {
      title: 'Ask GovAI',
      client: 'Side project · live',
      oneLiner: 'A measured RAG over 670+ federal AI/ML contract awards — BM25 retrieval feeding grounded, cited LLM synthesis with a refuse-to-invent guardrail.',
      metric: 'Reproducible eval · honest failure analysis',
      stack: ['TypeScript', 'RAG', 'BM25', 'Evals'],
      link: '/projects',
    },
    {
      title: 'Compass',
      client: 'PSG Global Solutions',
      oneLiner: 'Migrated a 7-year-old AngularJS recruiting platform to Angular 19 without a single hour of downtime.',
      metric: '~30% faster load · 10K+ monthly users',
      stack: ['Angular 19', 'TypeScript', 'Power BI', 'Azure DevOps'],
      link: '/projects',
    },
  ];

  readonly techStack = [
    { name: 'Angular 19', primary: true },
    { name: 'TypeScript', primary: true },
    { name: 'RxJS', primary: true },
    { name: 'SCSS', primary: true },
    { name: 'Node.js', primary: true },
    { name: 'Azure DevOps', primary: true },
    { name: 'React.js', primary: false },
    { name: 'JavaScript', primary: false },
    { name: 'Express', primary: false },
    { name: 'MongoDB', primary: false },
    { name: 'Power BI', primary: false },
    { name: 'AWS', primary: false },
    { name: 'Azure', primary: false },
    { name: 'GCP', primary: false },
    { name: 'Terraform', primary: false },
    { name: 'Docker', primary: false },
    { name: 'Kubernetes', primary: false },
    { name: 'Karma/Jasmine', primary: false },
    { name: 'CI/CD', primary: false },
    { name: 'Jenkins', primary: false },
    { name: 'Git', primary: false },
    { name: 'REST APIs', primary: false },
    { name: 'Tailwind CSS', primary: false },
  ];

  readonly journey: JourneyNode[] = [
    {
      year: '2020',
      title: 'Joined Infosys',
      description: 'High Performer (82%). Built Swiss Re\u2019s global claims platform serving 40+ countries and a cloud migration accelerator.',
      side: 'left',
    },
    {
      year: '2021',
      title: 'AWS Certified',
      description: 'Solutions Architect Associate. Multi-cloud infrastructure with Terraform across AWS, Azure, GCP.',
      side: 'right',
    },
    {
      year: '2022',
      title: 'Joined Thinkbridge',
      description: 'Senior Engineer leading the AI workstream — an AI voice-interview + fit-scoring system and a candidate-ranking engine — and modernized PSG’s platform to Angular 19 for 10,000+ users.',
      side: 'left',
    },
    {
      year: 'Now',
      title: 'Ready for What\u2019s Next',
      description: 'Open to senior and lead roles in full-stack and AI product. Let\u2019s build something great.',
      side: 'right',
    },
  ];
}
