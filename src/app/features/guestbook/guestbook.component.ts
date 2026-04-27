import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GuestbookService } from './guestbook.service';

@Component({
  selector: 'app-guestbook',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="guestbook">
      <!-- Header -->
      <div class="guestbook__hero">
        <span class="guestbook__icon">📝</span>
        <h2>Sign the Guestbook</h2>
        <p>Drop a note, share your thoughts, or just say hi. {{ entryCount() }} people have signed so far.</p>
      </div>

      <!-- Form -->
      <form class="guestbook__form" (ngSubmit)="submit()">
        <div class="guestbook__form-header">
          <div class="guestbook__form-avatar">
            {{ name.trim() ? name.trim().charAt(0).toUpperCase() : '?' }}
          </div>
          <input
            type="text"
            class="guestbook__input"
            [(ngModel)]="name"
            name="name"
            placeholder="Your name"
            maxlength="50"
            required
          />
        </div>
        <textarea
          class="guestbook__textarea"
          [(ngModel)]="message"
          name="message"
          placeholder="Leave a message..."
          maxlength="500"
          rows="3"
          required
        ></textarea>
        <div class="guestbook__form-footer">
          <span class="guestbook__char-count">{{ message.length }}/500</span>
          <button
            type="submit"
            class="guestbook__submit"
            [disabled]="!name.trim() || !message.trim() || cooldown()"
          >
            @if (cooldown()) {
              <span class="guestbook__submit-cooldown">Sent! ✓</span>
            } @else {
              Sign Guestbook
            }
          </button>
        </div>
      </form>

      <!-- Entries -->
      <div class="guestbook__entries">
        @for (entry of guestbook.entries(); track entry.id; let i = $index) {
          <div class="guestbook__card" [style.animation-delay]="i * 60 + 'ms'">
            <div class="guestbook__card-top">
              <div
                class="guestbook__avatar"
                [style.background]="getAvatarColor(entry.name)"
              >{{ entry.name.charAt(0).toUpperCase() }}</div>
              <div class="guestbook__meta">
                <span class="guestbook__name">{{ entry.name }}</span>
                <span class="guestbook__date">{{ formatDate(entry.timestamp) }}</span>
              </div>
            </div>
            <p class="guestbook__message">{{ entry.message }}</p>
            <div class="guestbook__reactions">
              @for (emoji of reactionEmojis; track emoji) {
                <button
                  class="guestbook__reaction"
                  [class.active]="entry.reactions[emoji] > 0"
                  (click)="react(entry.id, emoji)"
                  [title]="emoji"
                >
                  <span class="guestbook__reaction-emoji">{{ emoji }}</span>
                  @if (entry.reactions[emoji] > 0) {
                    <span class="guestbook__reaction-count">{{ entry.reactions[emoji] }}</span>
                  }
                </button>
              }
            </div>
          </div>
        } @empty {
          <div class="guestbook__empty">
            <span>✨</span>
            <p>Be the first to sign the guestbook!</p>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './guestbook.component.scss',
})
export class GuestbookComponent {
  readonly guestbook = inject(GuestbookService);
  readonly reactionEmojis = ['👍', '🎉', '🚀', '❤️', '💡'];

  readonly entryCount = computed(() => this.guestbook.entries().length);

  name = '';
  message = '';
  readonly cooldown = signal(false);

  private readonly avatarColors = [
    'linear-gradient(135deg, #6c63ff, #3b82f6)',
    'linear-gradient(135deg, #f43f5e, #ec4899)',
    'linear-gradient(135deg, #10b981, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #8b5cf6, #d946ef)',
    'linear-gradient(135deg, #14b8a6, #22d3ee)',
    'linear-gradient(135deg, #f97316, #eab308)',
  ];

  submit(): void {
    const n = this.name.trim();
    const m = this.message.trim();
    if (!n || !m) return;

    this.guestbook.addEntry(n, m);
    this.message = '';

    this.cooldown.set(true);
    setTimeout(() => this.cooldown.set(false), 5000);
  }

  react(entryId: string, emoji: string): void {
    this.guestbook.addReaction(entryId, emoji);
  }

  getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.avatarColors[Math.abs(hash) % this.avatarColors.length];
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    if (diffD < 30) return `${Math.floor(diffD / 7)}w ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
