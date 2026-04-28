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

interface ValueProp {
  icon: string;
  title: string;
  description: string;
  highlight: string;
}

interface JourneyNode {
  year: string;
  title: string;
  description: string;
  side: 'left' | 'right';
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

        <!-- Row 1: Name card + Status + Stats -->
        <div class="bento__card bento__card--name" appScrollReveal>
          <span class="bento__card-tag">// hello-world</span>
          <h2 class="bento__name">Nandan Hegde</h2>
          <p class="bento__role">Senior Software Engineer</p>
          <p class="bento__guild">Thinkbridge \u00B7 PSG Global Solutions</p>
          <div class="bento__available">
            <span class="bento__pulse"></span>
            Open to opportunities
          </div>
        </div>

        <div class="bento__card bento__card--status" appScrollReveal [delay]="80">
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

        <!-- Row 2: Stack cloud + What I bring (one card) -->
        <div class="bento__card bento__card--stack" appScrollReveal [delay]="120">
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

        <div class="bento__card bento__card--value" appScrollReveal [delay]="160">
          @for (prop of valueProps; track prop.title) {
            <div class="bento__value-item">
              <span class="bento__value-icon">{{ prop.icon }}</span>
              <div>
                <h4 class="bento__value-title">{{ prop.title }}</h4>
                <p class="bento__value-desc">{{ prop.description }}</p>
              </div>
            </div>
          }
        </div>

        <!-- Skills Marquee -->
        <div class="bento__marquee-wrap" appScrollReveal [delay]="180">
          <div class="bento__marquee">
            <div class="bento__marquee-track">
              @for (tech of marqueeSkills; track tech + '-1-' + $index) {
                <span class="bento__marquee-item">{{ tech }}</span>
              }
              @for (tech of marqueeSkills; track tech + '-2-' + $index) {
                <span class="bento__marquee-item" aria-hidden="true">{{ tech }}</span>
              }
            </div>
          </div>
        </div>

        <!-- Row 3: Featured Roast CTA (the wow CTA) -->
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
              A weekend experiment. Claude, a streaming endpoint, and three intensities of mean.
              Source linked. The system prompt took 3 rewrites — the first version only generated compliments.
            </p>
            <span class="bento__roast-hero-cta">Open the lab →</span>
          </div>
        </a>

        <!-- Row 3b: Wall of Wow (devs love this, recruiters skip) -->
        <div class="bento__card bento__card--wow" appScrollReveal [delay]="240">
          <span class="bento__card-tag">// for the curious</span>
          <h3 class="bento__wow-title">Try something fun</h3>
          <div class="bento__wow-grid">
            <a routerLink="/quiz" class="bento__wow-tile">
              <span class="bento__wow-tile-icon">🎯</span>
              <h4 class="bento__wow-tile-title">Team Quiz</h4>
              <p class="bento__wow-tile-desc">Find your dev archetype in 60 seconds.</p>
              <span class="bento__wow-tile-cta">Take it →</span>
            </a>
            <a routerLink="/about" class="bento__wow-tile">
              <span class="bento__wow-tile-icon">🎮</span>
              <h4 class="bento__wow-tile-title">Character Sheet</h4>
              <p class="bento__wow-tile-desc">RPG-style about page. Forge your card.</p>
              <span class="bento__wow-tile-cta">View →</span>
            </a>
            <a routerLink="/404" class="bento__wow-tile">
              <span class="bento__wow-tile-icon">⌨️</span>
              <h4 class="bento__wow-tile-title">Live Terminal</h4>
              <p class="bento__wow-tile-desc">Type <code>help</code>, <code>ls</code>, or <code>sudo hire-me</code>.</p>
              <span class="bento__wow-tile-cta">Open →</span>
            </a>
          </div>
        </div>

        <!-- Row 4: Achievements -->
        <div class="bento__card bento__card--achievements" appScrollReveal [delay]="300">
          <span class="bento__card-tag">// achievements</span>
          <div class="bento__achievements-grid">
            @for (ach of achievements; track ach.title) {
              <div class="bento__achievement">
                <span class="bento__achievement-icon">{{ ach.icon }}</span>
                <div>
                  <h4 class="bento__achievement-title">{{ ach.title }}</h4>
                  <p class="bento__achievement-desc">{{ ach.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Row 5: Journey timeline (full width) -->
        <div class="bento__card bento__card--journey" appScrollReveal [delay]="340">
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

        <!-- Row 6: CTA -->
        <div class="bento__card bento__card--cta" appScrollReveal [delay]="380">
          <h2 class="bento__cta-text">Let\u2019s build something.</h2>
          <p class="bento__cta-sub">Open to senior frontend, full-stack, and lead roles.</p>
          <div class="bento__cta-buttons">
            <a routerLink="/contact" class="bento__cta-btn bento__cta-btn--primary">
              Get in Touch
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a routerLink="/dashboard" class="bento__cta-btn bento__cta-btn--secondary">Dev Dashboard</a>
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

  readonly valueProps: ValueProp[] = [
    {
      icon: '\u26A1',
      title: 'I Ship Fast, Cleanly',
      description: 'AngularJS to Angular 17 migration that cut load times by 30%. 100% sprint deadlines across 5 two-week sprints.',
      highlight: 'Code splitting \u2022 CI/CD pipelines \u2022 100% branch coverage',
    },
    {
      icon: '\uD83E\uDDE9',
      title: 'I Think in Systems',
      description: 'From real-time data sync engines to browser extensions serving 500+ users \u2014 I architect solutions, not just features.',
      highlight: 'Azure DevOps \u2022 Power BI integration \u2022 Multi-cloud (AWS/Azure/GCP)',
    },
    {
      icon: '\uD83E\uDD1D',
      title: 'I Multiply Teams',
      description: 'Mentoring juniors, translating business needs into sprints, and bridging stakeholders with engineering.',
      highlight: 'Cross-functional leadership \u2022 Agile estimation \u2022 Code reviews',
    },
  ];

  readonly techStack = [
    { name: 'Angular 17', primary: true },
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

  readonly marqueeSkills = [
    'Angular', 'TypeScript', 'RxJS', 'SCSS', 'Node.js', 'Express',
    'React.js', 'JavaScript', 'MongoDB', 'Azure DevOps', 'Power BI',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
    'Jenkins', 'Git', 'REST APIs', 'CI/CD', 'Three.js', 'Canvas API',
  ];

  readonly achievements = [
    {
      icon: '\u2601\uFE0F',
      title: 'AWS Certified',
      desc: 'Solutions Architect Associate \u2014 multi-cloud infrastructure',
    },
    {
      icon: '\u2B50',
      title: 'High Performer',
      desc: 'Infosys rating 82% \u2014 top-tier across 40+ country platform',
    },
    {
      icon: '\uD83D\uDE80',
      title: '10K+ Users Impacted',
      desc: 'PSG recruiting platform with SSO + Power BI for enterprise',
    },
    {
      icon: '\uD83C\uDFC6',
      title: '100% Sprint Delivery',
      desc: '5 consecutive two-week sprints with zero deadline misses',
    },
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
      description: 'Senior Engineer. Led Angular migration for PSG, integrated Power BI and SSO for 10,000+ users, built React AI prototype.',
      side: 'left',
    },
    {
      year: 'Now',
      title: 'Ready for What\u2019s Next',
      description: 'Looking for senior frontend, full-stack, or lead roles. Let\u2019s build something great.',
      side: 'right',
    },
  ];
}
