import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

interface QuizQuestion {
  id: number;
  scenario: string;
  options: QuizOption[];
}

interface QuizOption {
  text: string;
  traits: Record<string, number>;
}

interface Archetype {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  strengths: string[];
  color: string;
  gradient: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    scenario: "It\u2019s 4 PM Friday. A critical production bug drops. You...",
    options: [
      { text: "Cancel Friday night. It's just me and the debugger now.", traits: { firefighter: 3, architect: 1 } },
      { text: "Triage it \u2014 is it REALLY critical? Check metrics first", traits: { diplomat: 2, architect: 2 } },
      { text: "Rally the team, assign roles, coordinate the war room", traits: { captain: 3, diplomat: 1 } },
      { text: "Write a hotfix in 10 minutes, push to prod, worry later", traits: { maverick: 3, firefighter: 1 } },
    ],
  },
  {
    id: 2,
    scenario: "The designer hands you a pixel-perfect Figma with 47 custom animations. You...",
    options: [
      { text: "Challenge accepted. Time to show what CSS can really do", traits: { maverick: 2, firefighter: 2 } },
      { text: "Negotiate \u2014 which 10 animations give 90% of the impact?", traits: { diplomat: 3, architect: 1 } },
      { text: "Build a reusable animation system first, then implement", traits: { architect: 3, captain: 1 } },
      { text: "Ask the team who wants to pair on this \u2014 it\u2019ll be fun", traits: { captain: 2, diplomat: 2 } },
    ],
  },
  {
    id: 3,
    scenario: "A junior dev pushes directly to main without a code review. You...",
    options: [
      { text: "Revert immediately, then have a kind 1-on-1 about process", traits: { captain: 3, diplomat: 1 } },
      { text: "Review the code first \u2014 maybe it\u2019s actually fine?", traits: { diplomat: 3, maverick: 1 } },
      { text: "Set up branch protection rules so it can\u2019t happen again", traits: { architect: 3, captain: 1 } },
      { text: "Merge it, fix anything broken, teach them the flow after", traits: { maverick: 2, firefighter: 2 } },
    ],
  },
  {
    id: 4,
    scenario: "You need to choose the tech stack for a new greenfield project. You...",
    options: [
      { text: "Pick battle-tested tools the team already knows well", traits: { captain: 2, diplomat: 2 } },
      { text: "Research for a week, create a comparison matrix, present to the team", traits: { architect: 3, captain: 1 } },
      { text: "Try that exciting new framework you\u2019ve been eyeing", traits: { maverick: 3, firefighter: 1 } },
      { text: "Ask each team member what they\u2019d pick and find consensus", traits: { diplomat: 3, captain: 1 } },
    ],
  },
  {
    id: 5,
    scenario: "Sprint planning reveals the backlog has 200% more work than capacity. You...",
    options: [
      { text: "Prioritize ruthlessly \u2014 what ships the most value?", traits: { diplomat: 2, architect: 2 } },
      { text: "Volunteer to take on the extra load yourself", traits: { firefighter: 3, maverick: 1 } },
      { text: "Push back on scope \u2014 quality > quantity, always", traits: { architect: 3, diplomat: 1 } },
      { text: "Suggest splitting the team into focused squads", traits: { captain: 3, architect: 1 } },
    ],
  },
  {
    id: 6,
    scenario: "Your PR review has 47 comments from a very opinionated senior dev. You...",
    options: [
      { text: "Address each one thoughtfully \u2014 even if you disagree", traits: { diplomat: 3, architect: 1 } },
      { text: "Push back with evidence on the ones you feel strongly about", traits: { maverick: 2, architect: 2 } },
      { text: "Hop on a call \u2014 async debates are a time sink", traits: { captain: 3, firefighter: 1 } },
      { text: "Fix the valid ones, ignore the nitpicks, ship it", traits: { firefighter: 2, maverick: 2 } },
    ],
  },
  {
    id: 7,
    scenario: "The CEO walks in and asks \u201Cwhy does our app feel slow?\u201D You...",
    options: [
      { text: "Pull up Lighthouse scores and show them the data", traits: { architect: 3, diplomat: 1 } },
      { text: "Ask clarifying questions \u2014 slow where? On what device?", traits: { diplomat: 3, architect: 1 } },
      { text: "Start optimizing immediately \u2014 they\u2019re right, it IS slow", traits: { firefighter: 3, maverick: 1 } },
      { text: "Propose a performance sprint and lead the charge", traits: { captain: 3, firefighter: 1 } },
    ],
  },
];

const ARCHETYPES: Record<string, Archetype> = {
  architect: {
    id: 'architect',
    name: 'The Architect',
    emoji: '\uD83C\uDFD7\uFE0F',
    tagline: 'Systems thinker. Long-game player.',
    description: 'You don\u2019t just write code \u2014 you design systems. You think in abstractions, plan three sprints ahead, and your PRs come with architecture diagrams. Teams love you because nothing you build needs to be rebuilt.',
    strengths: ['System Design', 'Code Quality', 'Technical Vision', 'Documentation'],
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  firefighter: {
    id: 'firefighter',
    name: 'The Firefighter',
    emoji: '\uD83D\uDE92',
    tagline: 'When things break, you\u2019re already fixing them.',
    description: 'Production down at 3 AM? You\u2019re already in the terminal. You thrive under pressure, ship hotfixes at superhuman speed, and have saved more deployments than you can count. You\u2019re the first one called when things go sideways.',
    strengths: ['Crisis Management', 'Fast Debugging', 'Production Savvy', 'Resilience'],
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
  },
  captain: {
    id: 'captain',
    name: 'The Captain',
    emoji: '\uD83C\uDFA9',
    tagline: 'Born leader. Team amplifier.',
    description: 'You make everyone around you better. You run standups that don\u2019t suck, mentor juniors without condescension, and somehow always know who\u2019s blocked. You\u2019re the glue that holds the team together \u2014 half engineer, half coach.',
    strengths: ['Team Leadership', 'Mentoring', 'Communication', 'Organization'],
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #10b981)',
  },
  diplomat: {
    id: 'diplomat',
    name: 'The Diplomat',
    emoji: '\uD83E\uDD1D',
    tagline: 'Bridge builder between code and people.',
    description: 'You translate tech-speak to business-speak and back. You negotiate scope with PMs, keep designers happy, and resolve team conflicts before they escalate. Every team wishes they had you, especially during planning meetings.',
    strengths: ['Stakeholder Management', 'Negotiation', 'Empathy', 'Cross-functional'],
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  },
  maverick: {
    id: 'maverick',
    name: 'The Maverick',
    emoji: '\uD83D\uDE80',
    tagline: 'Move fast. Break conventions. Ship boldly.',
    description: 'You\u2019re the dev who brings new ideas, experiments with cutting-edge tools, and isn\u2019t afraid to rewrite things from scratch. Your code is either genius or terrifying \u2014 often both. Teams love your energy, even when your PRs make them nervous.',
    strengths: ['Innovation', 'Speed', 'Experimentation', 'Bold Decisions'],
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
  },
};

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="quiz">
      <div class="quiz__container">
        @if (!completed()) {
          <!-- Quiz In Progress -->
          <div class="quiz__header" appScrollReveal>
            <div class="quiz__icon">\uD83C\uDFAF</div>
            <h1 class="quiz__title">Would I Survive Your Team?</h1>
            <p class="quiz__subtitle">7 real scenarios. 1 developer archetype. 0 wrong answers.</p>
          </div>

          <!-- Progress Bar -->
          <div class="quiz__progress">
            <div class="quiz__progress-bar">
              <div
                class="quiz__progress-fill"
                [style.width.%]="progressPercent()"
              ></div>
            </div>
            <span class="quiz__progress-text">{{ currentIndex() + 1 }} / {{ questions.length }}</span>
          </div>

          <!-- Question Card -->
          <div class="quiz__question-card" [class.quiz__question-card--animating]="animating()">
            <div class="quiz__scenario">
              <span class="quiz__scenario-label">SCENARIO {{ currentIndex() + 1 }}</span>
              <h2 class="quiz__scenario-text">{{ currentQuestion().scenario }}</h2>
            </div>

            <div class="quiz__options">
              @for (option of currentQuestion().options; track $index) {
                <button
                  class="quiz__option"
                  (click)="selectOption(option)"
                  [style.animation-delay]="($index * 80) + 'ms'"
                >
                  <span class="quiz__option-letter">{{ optionLetters[$index] }}</span>
                  <span class="quiz__option-text">{{ option.text }}</span>
                </button>
              }
            </div>
          </div>
        } @else {
          <!-- Result -->
          <div class="quiz__result" appScrollReveal>
            <div class="quiz__result-reveal">
              <span class="quiz__result-label">YOUR ARCHETYPE</span>
              <div class="quiz__result-emoji">{{ resultArchetype()!.emoji }}</div>
            </div>

            <!-- Archetype Card -->
            <div class="quiz__archetype-card" [style.--archetype-color]="resultArchetype()!.color">
              <div class="quiz__archetype-inner">
                <div class="quiz__archetype-header">
                  <h2 class="quiz__archetype-name">{{ resultArchetype()!.name }}</h2>
                  <p class="quiz__archetype-tagline">{{ resultArchetype()!.tagline }}</p>
                </div>

                <p class="quiz__archetype-desc">{{ resultArchetype()!.description }}</p>

                <!-- Trait Bars -->
                <div class="quiz__traits">
                  <h3 class="quiz__traits-title">Your Strengths</h3>
                  @for (strength of resultArchetype()!.strengths; track strength) {
                    <div class="quiz__trait">
                      <span class="quiz__trait-label">{{ strength }}</span>
                      <div class="quiz__trait-bar">
                        <div
                          class="quiz__trait-fill"
                          [style.width.%]="getTraitValue($index)"
                          [style.background]="resultArchetype()!.gradient"
                          [style.animation-delay]="($index * 150) + 'ms'"
                        ></div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Runner-up -->
                @if (runnerUp()) {
                  <div class="quiz__runner-up">
                    <span>Runner-up: {{ runnerUp()!.emoji }} {{ runnerUp()!.name }}</span>
                  </div>
                }

                <div class="quiz__archetype-footer">
                  <span>nandanhegde1.github.io/portfolio/quiz</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="quiz__actions">
              <button class="quiz__action-btn quiz__action-btn--share" (click)="shareOnTwitter()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </button>
              <button class="quiz__action-btn quiz__action-btn--linkedin" (click)="shareOnLinkedIn()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Share on LinkedIn
              </button>
              <button class="quiz__action-btn quiz__action-btn--copy" (click)="copyResult()">
                {{ copied() ? '\u2705 Copied!' : '\uD83D\uDCCB Copy Result' }}
              </button>
              <button class="quiz__action-btn quiz__action-btn--download" (click)="downloadCard()">
                \uD83D\uDCE5 Download PNG
              </button>
              <button class="quiz__action-btn quiz__action-btn--retry" (click)="restart()">
                \u21BB Retake Quiz
              </button>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './quiz.component.scss',
})
export class QuizComponent {
  readonly questions = QUESTIONS;
  readonly optionLetters = ['A', 'B', 'C', 'D'];

  readonly currentIndex = signal(0);
  readonly scores = signal<Record<string, number>>({ architect: 0, firefighter: 0, captain: 0, diplomat: 0, maverick: 0 });
  readonly completed = signal(false);
  readonly animating = signal(false);
  readonly copied = signal(false);

  readonly currentQuestion = computed(() => this.questions[this.currentIndex()]);
  readonly progressPercent = computed(() => (this.currentIndex() / this.questions.length) * 100);

  readonly resultArchetype = computed<Archetype | null>(() => {
    if (!this.completed()) return null;
    const sorted = Object.entries(this.scores()).sort((a, b) => b[1] - a[1]);
    return ARCHETYPES[sorted[0][0]] || null;
  });

  readonly runnerUp = computed<Archetype | null>(() => {
    if (!this.completed()) return null;
    const sorted = Object.entries(this.scores()).sort((a, b) => b[1] - a[1]);
    return sorted.length > 1 ? ARCHETYPES[sorted[1][0]] : null;
  });

  selectOption(option: QuizOption): void {
    if (this.animating()) return;

    // Add traits
    const current = { ...this.scores() };
    for (const [trait, value] of Object.entries(option.traits)) {
      current[trait] = (current[trait] || 0) + value;
    }
    this.scores.set(current);

    // Advance or complete
    if (this.currentIndex() < this.questions.length - 1) {
      this.animating.set(true);
      setTimeout(() => {
        this.currentIndex.update(i => i + 1);
        this.animating.set(false);
      }, 300);
    } else {
      this.completed.set(true);
    }
  }

  getTraitValue(index: number): number {
    const values = [95, 82, 68, 55];
    return values[index] || 55;
  }

  shareOnTwitter(): void {
    const arch = this.resultArchetype();
    if (!arch) return;
    const text = encodeURIComponent(`${arch.emoji} I'm "${arch.name}" \u2014 ${arch.tagline}\n\nTook the "Would I Survive Your Team?" quiz on @nandanhegde's portfolio.\n\nFind your archetype \u2192 nandanhegde1.github.io/portfolio/quiz`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
  }

  shareOnLinkedIn(): void {
    const url = encodeURIComponent('https://nandanhegde1.github.io/portfolio/quiz');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener');
  }

  copyResult(): void {
    const arch = this.resultArchetype();
    if (!arch) return;
    const text = `${arch.emoji} ${arch.name} \u2014 ${arch.tagline}\n\n${arch.description}\n\nTake the quiz: nandanhegde1.github.io/portfolio/quiz`;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  downloadCard(): void {
    const arch = this.resultArchetype();
    if (!arch) return;

    const canvas = document.createElement('canvas');
    const W = 700, H = 480;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a0e1a');
    bg.addColorStop(0.5, '#12162a');
    bg.addColorStop(1, '#0a0e1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Glow
    const glow = ctx.createRadialGradient(W * 0.7, 100, 0, W * 0.7, 100, 250);
    glow.addColorStop(0, arch.color + '25');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = arch.color;
    ctx.lineWidth = 3;
    ctx.roundRect(4, 4, W - 8, H - 8, 16);
    ctx.stroke();

    // Emoji
    ctx.font = '60px serif';
    ctx.fillText(arch.emoji, 30, 75);

    // Name
    ctx.font = 'bold 36px "Inter", sans-serif';
    ctx.fillStyle = '#e6edf3';
    ctx.fillText(arch.name, 110, 65);

    // Tagline
    ctx.font = '16px "Inter", sans-serif';
    ctx.fillStyle = arch.color;
    ctx.fillText(arch.tagline, 110, 90);

    // Separator
    ctx.strokeStyle = arch.color + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 115);
    ctx.lineTo(W - 30, 115);
    ctx.stroke();

    // Description
    ctx.font = '15px "Inter", sans-serif';
    ctx.fillStyle = '#c9d1d9';
    this.wrapText(ctx, arch.description, 30, 145, W - 60, 22);

    // Strengths
    const strengthY = 280;
    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.fillStyle = arch.color;
    ctx.fillText('STRENGTHS', 30, strengthY);

    arch.strengths.forEach((s, i) => {
      const barY = strengthY + 18 + i * 30;

      ctx.font = '13px "Inter", sans-serif';
      ctx.fillStyle = '#8b949e';
      ctx.fillText(s, 30, barY + 12);

      // Bar bg
      ctx.fillStyle = '#1e2333';
      ctx.roundRect(180, barY, W - 220, 14, 7);
      ctx.fill();

      // Bar fill
      const widths = [0.92, 0.78, 0.65, 0.55];
      const barGrad = ctx.createLinearGradient(180, 0, 180 + (W - 220) * widths[i], 0);
      barGrad.addColorStop(0, arch.color);
      barGrad.addColorStop(1, arch.color + '80');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(180, barY, (W - 220) * widths[i], 14, 7);
      ctx.fill();
    });

    // Footer
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillStyle = '#484f58';
    ctx.fillText('nandanhegde1.github.io/portfolio/quiz', 30, H - 25);
    ctx.textAlign = 'right';
    ctx.fillText('"Would I Survive Your Team?"', W - 30, H - 25);
    ctx.textAlign = 'left';

    const link = document.createElement('a');
    link.download = `archetype-${arch.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number): void {
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for (const w of words) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line.trim(), x, cy);
        line = w + ' ';
        cy += lh;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), x, cy);
  }

  restart(): void {
    this.currentIndex.set(0);
    this.scores.set({ architect: 0, firefighter: 0, captain: 0, diplomat: 0, maverick: 0 });
    this.completed.set(false);
    this.copied.set(false);
  }
}
