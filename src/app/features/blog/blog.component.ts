import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { AnimatedCounterComponent } from '../../shared/components';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

interface TechCard {
  icon: string;
  name: string;
  tagline: string;
  why: string;
  details: string[];
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [AnimatedCounterComponent, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="built">
      <div class="built__container">
        <div class="built__header" appScrollReveal>
          <span class="built__tag">// view-source</span>
          <h1 class="built__title">Under the Hood</h1>
          <p class="built__subtitle">How this portfolio was engineered — from concept to deploy.</p>
        </div>

        <div class="built__terminal" appScrollReveal>
          <div class="built__terminal-header">
            <span class="built__terminal-dot built__terminal-dot--red"></span>
            <span class="built__terminal-dot built__terminal-dot--yellow"></span>
            <span class="built__terminal-dot built__terminal-dot--green"></span>
            <span class="built__terminal-title">portfolio — build</span>
          </div>
          <div class="built__terminal-body">
            @for (line of terminalLines(); track $index) {
              <div
                class="built__terminal-line"
                [class.built__terminal-line--cmd]="line.startsWith('$')"
                [class.built__terminal-line--success]="line.startsWith(successChar)"
                [class.built__terminal-line--info]="line.startsWith(boltChar) || line.startsWith(rocketChar)"
              >{{ line }}</div>
            }
            @if (terminalDone()) {
              <div class="built__terminal-cursor"></div>
            }
          </div>
        </div>

        <div class="built__stats" appScrollReveal [delay]="200">
          <h3 class="built__section-title">By the Numbers</h3>
          <div class="built__stats-grid">
            @for (stat of buildStats; track stat.label) {
              <div class="built__stat-card">
                <span class="built__stat-icon">{{ stat.icon }}</span>
                <div class="built__stat-value">
                  <app-animated-counter [targetValue]="stat.value" size="sm" />
                  @if (stat.suffix) {
                    <span class="built__stat-suffix">{{ stat.suffix }}</span>
                  }
                </div>
                <span class="built__stat-label">{{ stat.label }}</span>
              </div>
            }
          </div>
        </div>

        <div class="built__stack" appScrollReveal [delay]="300">
          <h3 class="built__section-title">The Stack</h3>
          <div class="built__stack-grid">
            @for (tech of techStack; track tech.name; let i = $index) {
              <div
                class="built__tech-card"
                [class.built__tech-card--expanded]="expandedTech() === i"
                (click)="toggleTech(i)"
              >
                <div class="built__tech-header">
                  <span class="built__tech-icon">{{ tech.icon }}</span>
                  <div class="built__tech-info">
                    <h4 class="built__tech-name">{{ tech.name }}</h4>
                    <p class="built__tech-tagline">{{ tech.tagline }}</p>
                  </div>
                  <span class="built__tech-toggle">{{ expandedTech() === i ? '−' : '+' }}</span>
                </div>
                @if (expandedTech() === i) {
                  <div class="built__tech-details">
                    <p class="built__tech-why">{{ tech.why }}</p>
                    <div class="built__tech-features">
                      @for (detail of tech.details; track detail) {
                        <span class="built__tech-feature">{{ detail }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <div class="built__decisions" appScrollReveal [delay]="400">
          <h3 class="built__section-title">Design Decisions</h3>
          <div class="built__decisions-grid">
            @for (d of decisions; track d.question) {
              <div class="built__decision-card">
                <h4 class="built__decision-q">{{ d.question }}</h4>
                <p class="built__decision-a">{{ d.answer }}</p>
              </div>
            }
          </div>
        </div>

        <div class="built__colophon" appScrollReveal [delay]="500">
          <h3 class="built__section-title">Colophon</h3>
          <div class="built__colophon-grid">
            @for (item of colophon; track item.key) {
              <div class="built__colophon-item">
                <span class="built__colophon-key">{{ item.key }}</span>
                <span class="built__colophon-val">{{ item.val }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrl: './blog.component.scss',
})
export class BlogComponent implements OnInit, OnDestroy {
  readonly terminalLines = signal<string[]>([]);
  readonly terminalDone = signal(false);
  readonly expandedTech = signal<number | null>(null);

  // These avoid inline emoji in template expressions which can cause encoding issues
  readonly successChar = '\u2713';
  readonly boltChar = '\u26A1';
  readonly rocketChar = '\uD83D\uDE80';

  private terminalTimer: ReturnType<typeof setTimeout> | null = null;

  readonly buildStats = [
    { value: 25, suffix: '+', label: 'Components', icon: '\uD83E\uDDE9' },
    { value: 8, suffix: '', label: 'Services', icon: '\u2699\uFE0F' },
    { value: 5, suffix: '', label: 'Themes', icon: '\uD83C\uDFA8' },
    { value: 2000, suffix: '+', label: 'Lines of SCSS', icon: '\uD83D\uDC85' },
    { value: 15, suffix: '+', label: 'Terminal Cmds', icon: '\u2328\uFE0F' },
    { value: 1, suffix: '', label: 'AI Chatbot', icon: '\uD83E\uDD16' },
  ];

  readonly techStack: TechCard[] = [
    {
      icon: '\uD83C\uDD70\uFE0F',
      name: 'Angular 19',
      tagline: 'The framework that powers everything',
      why: 'Standalone components, signals, and the new control flow syntax make Angular 19 the most productive framework for building complex SPAs. Type-safe, fast, and SSR-ready.',
      details: ['Standalone components', 'Signal-based state', '@if/@for/@defer', 'OnPush change detection', 'Lazy-loaded routes'],
    },
    {
      icon: '\uD83C\uDFA8',
      name: 'Three.js',
      tagline: '3D particles in the hero section',
      why: '1,500 animated particles that react to mouse movement and adapt their color to whichever theme is active. Lazy-loaded via @defer so it never blocks the critical rendering path.',
      details: ['1500 animated particles', 'Mouse parallax', 'Theme-reactive colors', '@defer lazy loading', '2D CSS fallback'],
    },
    {
      icon: '\uD83E\uDD16',
      name: 'Claude AI',
      tagline: 'An AI that knows my resume by heart',
      why: 'A real conversational AI powered by Anthropic\'s Claude \u2014 not a keyword matcher. Has my complete resume as system context and maintains conversation history across messages.',
      details: ['Anthropic Claude API', 'Full resume context', 'Conversation memory', 'Rate-limited proxy', 'Graceful offline fallback'],
    },
    {
      icon: '\uD83C\uDFD7\uFE0F',
      name: 'SCSS + 5 Themes',
      tagline: 'Zero hardcoded colors',
      why: 'A complete design system with CSS custom properties for theming. Every color \u2014 from navbar to heatmap cells \u2014 is a variable. Switch themes and everything adapts instantly.',
      details: ['5 color themes', 'CSS custom properties', 'BEM methodology', '7 SCSS partials', 'Responsive mixin system'],
    },
    {
      icon: '\u26A1',
      name: 'Express Backend',
      tagline: 'Lightweight API proxy',
      why: 'A minimal Express 5 server that proxies API calls to Claude and handles rate limiting. Keeps API keys server-side and CORS-safe.',
      details: ['Express 5', 'Helmet security headers', 'Rate limiting', 'CORS configured', '.env secret management'],
    },
    {
      icon: '\uD83D\uDDBC\uFE0F',
      name: 'Canvas API',
      tagline: 'Downloadable holographic cards',
      why: 'The "Forge Your Card" feature renders custom developer cards onto a Canvas element and exports them as high-DPI PNG images. Zero external libraries \u2014 pure Canvas 2D.',
      details: ['Canvas 2D rendering', 'Retina export (2x DPI)', 'Gradient effects', 'PNG download', 'URL-encoded sharing'],
    },
  ];

  readonly decisions = [
    {
      question: '"Why build from scratch?"',
      answer: 'Templates are for people who don\'t know their framework. Every component here was hand-crafted to showcase Angular 19 \u2014 not copied from a theme.',
    },
    {
      question: '"Why 5 themes?"',
      answer: 'Dark mode is table stakes. Synthwave is a personality statement. Nord is for minimalists. Dracula is for the night owls. Light mode is for the brave.',
    },
    {
      question: '"Why an RPG character sheet?"',
      answer: 'Skill percentage bars are on every portfolio. Quest logs, inventory, and a holographic trading card that visitors can create for themselves? Those are memorable.',
    },
    {
      question: '"Why a real AI chatbot?"',
      answer: 'I can\'t be online 24/7 to answer recruiter questions. Claude can \u2014 and it knows my entire resume, tech stack, and career history by heart.',
    },
    {
      question: '"Why let visitors forge cards?"',
      answer: 'Interactivity creates connection. When visitors create something personalized on your site, they remember it. And they share it.',
    },
  ];

  readonly colophon = [
    { key: 'Framework', val: 'Angular 19' },
    { key: 'Language', val: 'TypeScript 5.x' },
    { key: 'Styling', val: 'SCSS + CSS Custom Props' },
    { key: '3D Engine', val: 'Three.js' },
    { key: 'AI', val: 'Claude by Anthropic' },
    { key: 'Backend', val: 'Express 5 / Node.js' },
    { key: 'Fonts', val: 'Space Grotesk \u00B7 Inter \u00B7 JetBrains Mono' },
    { key: 'Deploy', val: 'GitHub Pages' },
  ];

  private readonly commands = [
    '$ ng new portfolio --style=scss --ssr',
    '$ npm install three @types/three gsap',
    '$ npm install @anthropic-ai/sdk express helmet',
    '$ ng g component features/hero',
    '$ ng g component features/dashboard',
    '$ ng g service core/services/github',
    '$ ng g service core/services/theme',
    '...',
    '',
    '\u26A1 Compiling portfolio...',
    '\u2713 25+ components compiled',
    '\u2713 5 themes loaded',
    '\u2713 1 AI chatbot initialized',
    '\u2713 Built successfully in 26s',
    '',
    '\uD83D\uDE80 Ready to deploy.',
  ];

  ngOnInit(): void {
    this.typeTerminal();
  }

  ngOnDestroy(): void {
    if (this.terminalTimer) clearTimeout(this.terminalTimer);
  }

  toggleTech(index: number): void {
    this.expandedTech.set(this.expandedTech() === index ? null : index);
  }

  private typeTerminal(): void {
    let i = 0;
    const addLine = (): void => {
      if (i >= this.commands.length) {
        this.terminalDone.set(true);
        return;
      }
      this.terminalLines.update(lines => [...lines, this.commands[i]]);
      i++;
      const delay = this.commands[i - 1]?.startsWith('$') ? 600 : 300;
      this.terminalTimer = setTimeout(addLine, delay);
    };
    this.terminalTimer = setTimeout(addLine, 800);
  }
}
