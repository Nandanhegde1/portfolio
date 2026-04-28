import { Component, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GuestbookService } from './guestbook.service';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { burstConfetti } from '../../shared/utils/confetti';

interface NoteStyle {
  rotation: number;
  paper: 'yellow' | 'pink' | 'mint' | 'sky' | 'lilac' | 'peach';
  pin: 'red' | 'blue' | 'green' | 'amber';
  offsetY: number;
}

@Component({
  selector: 'app-guestbook',
  standalone: true,
  imports: [FormsModule, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="board">
      <div class="board__inner">
        <header class="board__header">
          <span class="board__tape board__tape--a"></span>
          <span class="board__tape board__tape--b"></span>
          <h1 class="board__title">The Wall</h1>
          <p class="board__sub">
            A corkboard for whoever stops by.
            <strong>{{ entryCount() }}</strong> notes pinned so far.
          </p>
        </header>

        @if (guestbook.error()) {
          <div class="board__alert" role="alert">
            <span>⚡ Backend snoozing — Render free-tier server is waking up. Your note will still send.</span>
            <button (click)="guestbook.loadEntries()">retry</button>
          </div>
        }

        <form class="board__composer" (ngSubmit)="submit()">
          <span class="board__pin board__pin--blue board__pin--composer" aria-hidden="true"></span>
          <span class="board__composer-label">// pin a new note</span>
          <input
            type="text"
            class="board__composer-name"
            [(ngModel)]="name"
            name="name"
            placeholder="signed,"
            maxlength="50"
            required
          />
          <textarea
            class="board__composer-msg"
            [(ngModel)]="message"
            name="message"
            placeholder="Leave anything — a thought, a thanks, a roast, a recipe."
            maxlength="500"
            rows="3"
            required
          ></textarea>
          <div class="board__composer-foot">
            <span class="board__composer-count">{{ message.length }}/500</span>
            <button
              type="submit"
              class="board__composer-btn"
              [disabled]="!name.trim() || !message.trim() || cooldown()"
            >
              @if (cooldown()) {
                <span>pinned ✓</span>
              } @else {
                pin it &uarr;
              }
            </button>
          </div>
        </form>

        <div class="board__wall">
          @for (entry of guestbook.entries(); track entry.id; let i = $index) {
            @let style = styleFor(entry.id, i);
            <article
              class="board__note"
              [class]="'board__note--' + style.paper"
              [style.--rot]="style.rotation + 'deg'"
              [style.--y]="style.offsetY + 'px'"
              [style.animation-delay]="(i * 50) + 'ms'"
            >
              <span class="board__pin" [class]="'board__pin--' + style.pin" aria-hidden="true"></span>
              <p class="board__note-msg">{{ entry.message }}</p>
              <footer class="board__note-foot">
                <span class="board__note-name">— {{ entry.name }}</span>
                <span class="board__note-date">{{ formatDate(entry.timestamp) }}</span>
              </footer>
              <div class="board__note-reactions">
                @for (emoji of reactionEmojis; track emoji) {
                  <button
                    class="board__reaction"
                    [class.board__reaction--active]="entry.reactions[emoji] > 0"
                    (click)="react(entry.id, emoji)"
                    [appTooltip]="reactionLabels[emoji]"
                    [attr.aria-label]="reactionLabels[emoji]"
                  >
                    <span>{{ emoji }}</span>
                    @if (entry.reactions[emoji] > 0) {
                      <span class="board__reaction-n">{{ entry.reactions[emoji] }}</span>
                    }
                  </button>
                }
              </div>
            </article>
          } @empty {
            <div class="board__empty">
              <span>📌</span>
              <p>Nothing pinned yet. Be the first.</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './guestbook.component.scss',
})
export class GuestbookComponent {
  readonly guestbook = inject(GuestbookService);
  readonly reactionEmojis = ['👍', '🎉', '🚀', '❤️', '💡'];
  readonly reactionLabels: Record<string, string> = {
    '👍': 'Like',
    '🎉': 'Celebrate',
    '🚀': 'Inspiring',
    '❤️': 'Love',
    '💡': 'Insightful',
  };

  readonly entryCount = computed(() => this.guestbook.entries().length);

  name = '';
  message = '';
  readonly cooldown = signal(false);

  private readonly papers: NoteStyle['paper'][] = ['yellow', 'pink', 'mint', 'sky', 'lilac', 'peach'];
  private readonly pins: NoteStyle['pin'][] = ['red', 'blue', 'green', 'amber'];

  styleFor(id: string, index: number): NoteStyle {
    const hash = this.hash(id || String(index));
    const rotation = ((hash % 11) - 5);
    const offsetY = (((hash >> 3) % 13) - 6);
    const paper = this.papers[hash % this.papers.length];
    const pin = this.pins[(hash >> 5) % this.pins.length];
    return { rotation, paper, pin, offsetY };
  }

  private hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  submit(): void {
    const n = this.name.trim();
    const m = this.message.trim();
    if (!n || !m) return;
    this.guestbook.addEntry(n, m);
    this.message = '';

    if (typeof window !== 'undefined') {
      const btn = document.querySelector<HTMLElement>('.board__composer-btn');
      const r = btn?.getBoundingClientRect();
      burstConfetti({
        x: r ? r.left + r.width / 2 : window.innerWidth / 2,
        y: r ? r.top : window.innerHeight / 2,
        count: 60,
      });
    }
    this.cooldown.set(true);
    setTimeout(() => this.cooldown.set(false), 4000);
  }

  react(id: string, emoji: string): void {
    this.guestbook.addReaction(id, emoji);
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}