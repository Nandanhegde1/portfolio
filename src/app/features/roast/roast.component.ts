import { Component, ChangeDetectionStrategy, signal, inject, ElementRef, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { environment } from '../../../environments/environment';
import { SoundService } from '../../core/services/sound.service';
import { ToastService } from '../../core/services/toast.service';
import { LanguageService } from '../../core/i18n/language.service';

interface RoastResult {
  stack: string;
  roast: string;
  intensity: string;
  timestamp: number;
}

/* eslint-disable no-useless-escape -- preserve verbatim quote styling in roast strings */
const FALLBACK_ROASTS: Record<string, string[]> = {
  react: [
    'Bro said React, Next.js, and Tailwind. So original. You and 47 million other devs picked the exact same stack after watching the same YouTube tutorial. Your create-next-app has more boilerplate than a legal contract. But honestly? Your Vercel deploy game is probably spotless.',
    'React with 19 state management libraries because useState felt too simple. Your node_modules folder filed for its own zip code and your useEffect has more dependencies than a soap opera plot. At least your components re-render faster than your career decisions.',
  ],
  angular: [
    'Angular, RxJS, NgRx, SCSS, and a 47-page style guide. Sir, your framework has a framework. Your learning curve is so steep it needs oxygen tanks at the top. I bet your \"quick prototype\" takes 3 sprints and requires a PhD in dependency injection. But real talk \u2014 when it works, it WORKS.',
    'You chose Angular in the current year. Voluntarily. Your bundle size has its own gravitational pull and your tsconfig has more options than a restaurant menu. The good news? Job security. Nobody else wants to touch your codebase.',
  ],
  vue: [
    'Vue, Nuxt, Pinia. The \"I read the docs once and mass my startup on it\" starter pack. You picked this because Evan You seems nice and the docs have pretty colors. Your Options API is showing \u2014 might want to tuck that in. Still, your DX is chef\'s kiss.',
    'Vue.js \u2014 the framework equivalent of \"I\'m not like other frameworks.\" You have strong opinions about Composition API vs Options API and zero opinions about touching grass. Your app works great though, all 3 users love it.',
  ],
  python: [
    'Python, Django, PostgreSQL. The \"I learned to code from a university course in 2015\" stack. Your indentation-based language means one wrong space and your entire app commits seppuku. But honestly, your server probably boots faster than a React developer\'s laptop.',
    'Bro is running Python in production like whitespace is a personality trait. Your requirements.txt reads like a grocery list from someone having a breakdown. But the ML model you\'ll definitely add someday? Gonna be fire.',
  ],
  java: [
    'Java, Spring Boot, Kafka, Kubernetes. Respectfully, your tech stack doesn\'t deploy, it files for an IPO. You need 14 annotations just to say hello and each one requires a committee meeting. Your AbstractSingletonProxyFactoryBean called \u2014 it wants a promotion. At least you\'ll never be unemployed.',
    'Java in the current year. Your code is so verbose it counts as a novel. Your enterprise architect has an enterprise architect. But let\'s be real \u2014 banks trust your stack with trillions, so who\'s really winning?',
  ],
  php: [
    'PHP and MySQL in 2026. Respectfully, your stack has a LinkedIn profile that says \"open to opportunities\" since 2014. You\'re the digital equivalent of a fax machine that still works perfectly. Your code runs on 78% of the web though, so I guess the joke\'s on us.',
  ],
  default: [
    'That stack is so unique it probably has its own subreddit with 12 subscribers. You picked technologies like you\'re speedrunning a Hacker News bingo card. Your architecture diagram needs its own architecture diagram. But honestly? Shipping > debating, and you clearly ship.',
    'Look, I\'ve never seen this combination of technologies in the wild before, and I\'ve seen some things. Your stack has the energy of someone who googled \"best tech stack 2026\" and clicked \"I\'m feeling lucky.\" The audacity is honestly inspiring. Ship it.',
  ],
};
/* eslint-enable no-useless-escape */

@Component({
  selector: 'app-roast',
  standalone: true,
  imports: [FormsModule, ScrollRevealDirective, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="roast">
      <div class="roast__container">
        <!-- Header -->
        <div class="roast__header" appScrollReveal>
          <span class="roast__eyebrow">// the lab · ai experiment #1</span>
          <div class="roast__icon">🔥</div>
          <h1 class="roast__title">Roast My Stack</h1>
          <p class="roast__subtitle">
            A weekend experiment. I gave Claude permission to be mean about your tech stack,
            wired it to a streaming endpoint, and put it on the internet.
            The system prompt is 47 lines and took 3 rewrites &mdash; the first version only generated compliments.
          </p>
          <div class="roast__source-chips">
            <a href="https://github.com/Nandanhegde1/portfolio/blob/main/backend/routes/roast.js" target="_blank" rel="noopener" class="roast__chip">
              <span>→</span> backend route
            </a>
            <a href="https://github.com/Nandanhegde1/portfolio/blob/main/backend/prompts/roast.js" target="_blank" rel="noopener" class="roast__chip">
              <span>→</span> system prompt
            </a>
            <a routerLink="/under-the-hood" class="roast__chip">
              <span>→</span> how it's built
            </a>
          </div>
        </div>

        <!-- Input Section -->
        <div class="roast__input-area" appScrollReveal [delay]="100">
          <div class="roast__input-wrapper">
            <textarea
              class="roast__textarea"
              [(ngModel)]="stackInput"
              placeholder="e.g. React, TypeScript, Tailwind, Supabase, Vercel..."
              [maxlength]="500"
              rows="3"
              (keydown.enter)="onEnterKey($event)"
            ></textarea>
            <span class="roast__char-count">{{ stackInput().length }}/500</span>
          </div>

          <!-- Quick presets -->
          <div class="roast__presets">
            <span class="roast__presets-label">Quick picks:</span>
            @for (preset of presets; track preset.label) {
              <button
                class="roast__preset-btn"
                (click)="stackInput.set(preset.stack)"
              >
                {{ preset.label }}
              </button>
            }
          </div>

          <!-- Intensity selector -->
          <div class="roast__intensity">
            <span class="roast__intensity-label">Roast Level:</span>
            <div class="roast__intensity-options">
              @for (level of intensityLevels; track level.value) {
                <button
                  class="roast__intensity-btn"
                  [class.roast__intensity-btn--active]="intensity() === level.value"
                  (click)="intensity.set(level.value)"
                >
                  {{ level.emoji }} {{ level.label }}
                </button>
              }
            </div>
          </div>

          <button
            class="roast__fire-btn"
            [disabled]="loading() || stackInput().length < 3"
            (click)="roastStack()"
          >
            @if (loading()) {
              <span class="roast__spinner"></span>
              Roasting...
            } @else {
              \uD83D\uDD25 Roast It
            }
          </button>
        </div>

        <!-- Result -->
        @if (result()) {
          <div class="roast__result-area" appScrollReveal>
            <!-- Shareable Card -->
            <div class="roast__card" #roastCard>
              <div class="roast__card-inner">
                <div class="roast__card-header">
                  <span class="roast__card-logo">&lt;NH/&gt;</span>
                  <span class="roast__card-badge">\uD83D\uDD25 {{ getIntensityLabel() }}</span>
                </div>
                <div class="roast__card-stack">
                  <span class="roast__card-stack-label">THE STACK</span>
                  <p class="roast__card-stack-text">{{ result()!.stack }}</p>
                </div>
                <div class="roast__card-roast">
                  <p>{{ result()!.roast }}<span class="roast__caret" [class.roast__caret--hidden]="!streaming()">&#9608;</span></p>
                </div>
                <div class="roast__card-footer">
                  <span>nandanhegde1.github.io/portfolio/roast</span>
                  <span>{{ getTimestamp() }}</span>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="roast__actions">
              <button class="roast__action-btn roast__action-btn--download" (click)="downloadCard()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download PNG
              </button>
              <button class="roast__action-btn roast__action-btn--copy" (click)="copyRoast()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                {{ copied() ? 'Copied!' : 'Copy Text' }}
              </button>
              <button class="roast__action-btn roast__action-btn--share" (click)="shareOnTwitter()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </button>
              <button class="roast__action-btn roast__action-btn--linkedin" (click)="shareOnLinkedIn()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Share on LinkedIn
              </button>
              <button class="roast__action-btn roast__action-btn--reddit" (click)="shareOnReddit()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.04 1.605a3.32 3.32 0 01.043.555c0 2.812-3.273 5.092-7.308 5.092-4.036 0-7.31-2.28-7.31-5.092 0-.187.014-.37.04-.552-.61-.27-1.040-.892-1.040-1.608 0-.967.786-1.754 1.754-1.754.477 0 .9.182 1.207.49 1.207-.86 2.876-1.424 4.744-1.488l.9-4.222a.345.345 0 01.18-.225.355.355 0 01.286-.005l2.97.628a1.25 1.25 0 011.137-.722zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 00.029-.463.33.33 0 00-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.232-.095z"/>
                </svg>
                Share on Reddit
              </button>
              <button class="roast__action-btn roast__action-btn--again" (click)="result.set(null)">
                \u21BB Try Another
              </button>
            </div>
          </div>
        }

        @if (error()) {
          <div class="roast__error">
            <p>{{ error() }}</p>
            <button (click)="error.set(null)">Dismiss</button>
          </div>
        }

        <!-- Roast counter -->
        <div class="roast__counter" appScrollReveal [delay]="200">
          <p><strong>{{ roastCount() }}</strong> stacks roasted and counting \uD83D\uDD25</p>
        </div>
      </div>
    </section>
  `,
  styleUrl: './roast.component.scss',
})
export class RoastComponent {
  private readonly http = inject(HttpClient);
  private readonly sound = inject(SoundService);
  private readonly toast = inject(ToastService);
  private readonly language = inject(LanguageService);
  readonly roastCardRef = viewChild<ElementRef<HTMLDivElement>>('roastCard');

  readonly stackInput = signal('');
  readonly intensity = signal('medium');
  readonly loading = signal(false);
  readonly streaming = signal(false);
  readonly result = signal<RoastResult | null>(null);
  readonly error = signal<string | null>(null);
  readonly copied = signal(false);
  readonly roastCount = signal(this.getStoredCount());

  readonly intensityLevels = [
    { value: 'mild', label: 'Mild', emoji: '\uD83C\uDF36\uFE0F' },
    { value: 'medium', label: 'Medium', emoji: '\uD83D\uDD25' },
    { value: 'savage', label: 'Savage', emoji: '\uD83D\uDCA0' },
  ];

  readonly presets = [
    { label: '\u269B\uFE0F React Bro', stack: 'React, Next.js, TypeScript, Tailwind CSS, Prisma, Vercel' },
    { label: '\uD83C\uDFF0 Angular Lord', stack: 'Angular, TypeScript, RxJS, NgRx, SCSS, Azure DevOps' },
    { label: '\uD83D\uDC8E Vue Hipster', stack: 'Vue.js, Nuxt, Pinia, Vite, UnoCSS, Supabase' },
    { label: '\uD83D\uDC0D Python Wizard', stack: 'Python, Django, PostgreSQL, Redis, Docker, AWS Lambda' },
    { label: '\u2615 Java Enterprise', stack: 'Java, Spring Boot, Kafka, Kubernetes, Oracle DB, Jenkins' },
    { label: '\uD83E\uDD80 Rust Zealot', stack: 'Rust, Actix-web, WASM, Nix, PostgreSQL, Cloudflare Workers' },
  ];

  roastStack(): void {
    const stack = this.stackInput().trim();
    if (stack.length < 3) return;

    const intensity = this.intensity();
    this.sound.play('click');
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.streamRoast(stack, intensity).catch(() => {
      const roast = this.getLocalRoast(stack);
      this.result.set({ stack, roast, intensity, timestamp: Date.now() });
      this.incrementCount();
      this.loading.set(false);
      this.streaming.set(false);
      this.sound.play('error');
    });
  }

  // Streams the roast token-by-token from /api/roast/stream so the user
  // sees text appearing in ~1s instead of waiting ~10s for the full reply.
  private async streamRoast(stack: string, intensity: string): Promise<void> {
    const response = await fetch(`${environment.apiUrl}/api/roast/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stack, intensity, lang: this.language.current() }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Roast stream failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let started = false;
    const ts = Date.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';

      for (const frame of frames) {
        let event = 'message';
        let data = '';
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        if (!data) continue;

        let payload: { text?: string; roast?: string; error?: string };
        try { payload = JSON.parse(data); } catch { continue; }

        if (event === 'chunk' && payload.text) {
          text += payload.text;
          if (!started) {
            started = true;
            this.loading.set(false);
            this.streaming.set(true);
          }
          this.result.set({ stack, roast: text, intensity, timestamp: ts });
        } else if (event === 'done') {
          const finalRoast = payload.roast || text;
          this.result.set({ stack, roast: finalRoast, intensity, timestamp: ts });
          this.incrementCount();
          this.loading.set(false);
          this.streaming.set(false);
          this.sound.play('success');
          return;
        } else if (event === 'error') {
          this.streaming.set(false);
          throw new Error(payload.error || 'stream error');
        }
      }
    }
  }

  downloadCard(): void {
    const r = this.result();
    if (!r) return;

    const canvas = document.createElement('canvas');
    const W = 800;
    const H = 520;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0a0e1a');
    bgGrad.addColorStop(0.5, '#1a1035');
    bgGrad.addColorStop(1, '#0a0e1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Glow orb top-right
    const glowGrad = ctx.createRadialGradient(W - 100, 80, 0, W - 100, 80, 200);
    glowGrad.addColorStop(0, 'rgba(255, 100, 50, 0.15)');
    glowGrad.addColorStop(1, 'rgba(255, 100, 50, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);

    // Border
    const borderGrad = ctx.createLinearGradient(0, 0, W, H);
    borderGrad.addColorStop(0, '#ff6b35');
    borderGrad.addColorStop(0.5, '#ff2d2d');
    borderGrad.addColorStop(1, '#ff6b35');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 3;
    ctx.roundRect(4, 4, W - 8, H - 8, 16);
    ctx.stroke();

    // Header
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8b949e';
    ctx.fillText('<NH/>', 30, 45);

    ctx.font = 'bold 14px "Inter", sans-serif';
    ctx.fillStyle = '#ff6b35';
    ctx.textAlign = 'right';
    ctx.fillText('\uD83D\uDD25 ROASTED', W - 30, 45);
    ctx.textAlign = 'left';

    // Separator
    const sepGrad = ctx.createLinearGradient(30, 0, W - 30, 0);
    sepGrad.addColorStop(0, 'rgba(255,107,53,0)');
    sepGrad.addColorStop(0.5, 'rgba(255,107,53,0.5)');
    sepGrad.addColorStop(1, 'rgba(255,107,53,0)');
    ctx.strokeStyle = sepGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 62);
    ctx.lineTo(W - 30, 62);
    ctx.stroke();

    // Stack label
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.fillStyle = '#ff6b35';
    ctx.letterSpacing = '2px';
    ctx.fillText('THE STACK', 30, 92);

    // Stack text
    ctx.font = '15px "Inter", sans-serif';
    ctx.fillStyle = '#e6edf3';
    ctx.letterSpacing = '0px';
    const stackText = r.stack;
    this.wrapText(ctx, stackText, 30, 115, W - 60, 22);

    // Roast text
    ctx.font = 'italic 16px "Inter", sans-serif';
    ctx.fillStyle = '#c9d1d9';
    const roastY = 170;
    ctx.fillText('\u201C', 25, roastY);
    this.wrapText(ctx, r.roast, 40, roastY, W - 80, 24);

    // Footer
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillStyle = '#484f58';
    ctx.fillText('nandanhegde1.github.io/portfolio/roast', 30, H - 25);
    ctx.textAlign = 'right';
    ctx.fillText(new Date(r.timestamp).toLocaleDateString(), W - 30, H - 25);
    ctx.textAlign = 'left';

    // Download
    const link = document.createElement('a');
    link.download = 'roast-my-stack.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (const word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line.trim(), x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
  }

  copyRoast(): void {
    const r = this.result();
    if (!r) return;
    const text = `\uD83D\uDD25 My tech stack got roasted!\n\nStack: ${r.stack}\n\nRoast: "${r.roast}"\n\nGet roasted: nandanhegde1.github.io/portfolio/roast`;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  shareOnTwitter(): void {
    const r = this.result();
    if (!r) return;
    // X/Twitter intent honors the `text` param. Quote a sizeable chunk so the
    // post still reads as a punchline if the user posts without editing.
    const quote = r.roast.length > 220 ? `${r.roast.slice(0, 217)}...` : r.roast;
    const text = encodeURIComponent(`\uD83D\uDD25 My tech stack (${r.stack}) just got roasted:\n\n"${quote}"\n\nGet yours roasted \u2192 nandanhegde1.github.io/portfolio/roast`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
  }

  // LinkedIn's share-offsite endpoint silently drops any `text`/`summary`/`title`
  // params (deprecated since 2022). It only previews the URL via OpenGraph tags,
  // so the roast itself never makes it to the composer. Workaround: stash the
  // roast on the clipboard *before* opening LinkedIn so the user just hits paste.
  shareOnLinkedIn(): void {
    const r = this.result();
    if (!r) return;
    const text = `\uD83D\uDD25 My tech stack (${r.stack}) just got roasted:\n\n"${r.roast}"\n\nGet yours roasted \u2192 https://nandanhegde1.github.io/portfolio/roast`;
    const open = () => {
      const url = encodeURIComponent('https://nandanhegde1.github.io/portfolio/roast');
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener');
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => this.toast.info('Roast copied!', 'LinkedIn won\u2019t prefill text \u2014 just paste into the post.'))
        .catch(() => { /* ignore */ })
        .finally(open);
    } else {
      open();
    }
  }

  shareOnReddit(): void {
    const r = this.result();
    if (!r) return;
    // Reddit's submit URL accepts `title` + `text` for self-posts. We point
    // selftext='1' so it opens the text editor (not the link form).
    const title = encodeURIComponent(`My ${r.stack.split(',')[0].trim()} stack got roasted by an AI \uD83D\uDD25`);
    const body = encodeURIComponent(`**The stack:** ${r.stack}\n\n**The roast:**\n\n> ${r.roast.split('\n').join('\n> ')}\n\n---\n\nGet yours obliterated \u2192 https://nandanhegde1.github.io/portfolio/roast`);
    window.open(`https://www.reddit.com/submit?selftext=true&title=${title}&text=${body}`, '_blank', 'noopener');
  }

  onEnterKey(event: Event): void {
    const kbEvent = event as KeyboardEvent;
    if (!kbEvent.shiftKey) {
      kbEvent.preventDefault();
      this.roastStack();
    }
  }

  getTimestamp(): string {
    const r = this.result();
    return r ? new Date(r.timestamp).toLocaleDateString() : '';
  }

  getIntensityLabel(): string {
    const r = this.result();
    if (!r) return 'ROASTED';
    const labels: Record<string, string> = { mild: 'LIGHTLY TOASTED', medium: 'ROASTED', savage: 'OBLITERATED' };
    return labels[r.intensity] || 'ROASTED';
  }

  private getLocalRoast(stack: string): string {
    const lower = stack.toLowerCase();
    for (const key of Object.keys(FALLBACK_ROASTS)) {
      if (key !== 'default' && lower.includes(key)) {
        const options = FALLBACK_ROASTS[key];
        return options[Math.floor(Math.random() * options.length)];
      }
    }
    const defaults = FALLBACK_ROASTS['default'];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  private getStoredCount(): number {
    try {
      return parseInt(localStorage.getItem('roast-count') || '42', 10);
    } catch {
      return 42;
    }
  }

  private incrementCount(): void {
    const next = this.roastCount() + 1;
    this.roastCount.set(next);
    try { localStorage.setItem('roast-count', String(next)); } catch { /* ignore quota / disabled storage */ }
  }
}
