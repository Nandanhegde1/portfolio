import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoastMeBackService } from './roast-me-back.service';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-roast-me-back',
  standalone: true,
  imports: [FormsModule, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rmb">
      <div class="rmb__inner">

        <!-- Header: the human invitation -->
        <header class="rmb__header" appScrollReveal>
          <span class="rmb__eyebrow">// fair's fair</span>
          <h1 class="rmb__title">My turn. <span class="rmb__title-accent">Roast me back.</span></h1>
          <p class="rmb__lede">
            The AI on /lab roasts your stack. This page flips it.
            Leave a one-line roast of <em>this</em> portfolio &mdash; the design, the copy,
            the over-engineering, the typo on /about (yes, I know).
            I read every one. The sharp ones get a reply. The brutal ones get pinned.
          </p>
          <p class="rmb__rules">
            <span>📏 280 chars</span>
            <span>🤖 bots filtered</span>
            <span>🤝 honest humans get replies</span>
          </p>
        </header>

        <!-- Stats strip: real or graceful blank -->
        @if (svc.count() > 0) {
          <div class="rmb__stats" appScrollReveal>
            <div class="rmb__stat"><strong>{{ svc.count() }}</strong> roasts received</div>
            @if (svc.replyCount() > 0) {
              <div class="rmb__stat"><strong>{{ svc.replyCount() }}</strong> replied to</div>
            }
            @if (svc.avgReplyMinutes() !== null) {
              <div class="rmb__stat"><strong>{{ formatReply(svc.avgReplyMinutes()!) }}</strong> avg reply time</div>
            }
          </div>
        }

        <!-- Composer -->
        <form class="rmb__composer" (ngSubmit)="submit()" appScrollReveal [delay]="80" novalidate>
          <label class="rmb__label" for="rmb-body">Your roast</label>
          <textarea
            id="rmb-body"
            class="rmb__textarea"
            [ngModel]="body()"
            (ngModelChange)="body.set($event)"
            name="body"
            placeholder="e.g. The bento grid has more cards than your last project had requirements."
            maxlength="280"
            rows="3"
            required
          ></textarea>
          <div class="rmb__counter" [class.rmb__counter--warn]="body().length > 240">
            {{ body().length }} / 280
          </div>

          <div class="rmb__row">
            <input
              class="rmb__input"
              [ngModel]="authorName()"
              (ngModelChange)="authorName.set($event)"
              name="authorName"
              placeholder="Your name (optional)"
              maxlength="60"
            />
            <input
              class="rmb__input"
              [ngModel]="authorLink()"
              (ngModelChange)="authorLink.set($event)"
              name="authorLink"
              placeholder="https://twitter.com/you (optional)"
              maxlength="200"
              type="text"
              inputmode="url"
            />
          </div>

          <div class="rmb__actions">
            <button
              type="submit"
              class="rmb__submit"
              [disabled]="!canSubmit() || posting()"
            >
              @if (posting()) {
                <span>posting…</span>
              } @else if (justPosted()) {
                <span>✓ posted &mdash; thanks for the heat</span>
              } @else {
                <span>🔥 send the roast</span>
              }
            </button>
            <span class="rmb__hint">Anonymous is fine. Your name + link are optional.</span>
          </div>

          @if (svc.error()) {
            <p class="rmb__error" role="alert">{{ svc.error() }}</p>
          }
        </form>

        <!-- The wall -->
        <div class="rmb__wall">
          @if (svc.loading() && svc.roasts().length === 0) {
            <p class="rmb__loading">Loading the heat…</p>
          } @else if (svc.roasts().length === 0) {
            <div class="rmb__empty">
              <span class="rmb__empty-emoji">🪦</span>
              <p>Quiet here. <strong>Be the first to bury me.</strong></p>
            </div>
          } @else {
            @for (r of svc.roasts(); track r.id; let i = $index) {
              <article class="rmb__card" [class.rmb__card--pinned]="r.is_pinned" [style.animation-delay]="(i * 40) + 'ms'">
                @if (r.is_pinned) {
                  <span class="rmb__pin" aria-label="Pinned by Nandan">📌 pinned</span>
                }

                <p class="rmb__card-body">"{{ r.body }}"</p>

                <footer class="rmb__card-foot">
                  @if (r.author_link) {
                    <a class="rmb__author" [href]="r.author_link" target="_blank" rel="noopener nofollow">
                      &mdash; {{ r.author_name || 'anon' }} ↗
                    </a>
                  } @else {
                    <span class="rmb__author">&mdash; {{ r.author_name || 'anon' }}</span>
                  }
                  <span class="rmb__date">{{ formatDate(r.created_at) }}</span>
                </footer>

                @if (r.reply_body) {
                  <div class="rmb__reply">
                    <span class="rmb__reply-badge">Nandan replied</span>
                    <p class="rmb__reply-body">{{ r.reply_body }}</p>
                  </div>
                }
              </article>
            }
          }
        </div>

      </div>
    </section>
  `,
  styleUrl: './roast-me-back.component.scss',
})
export class RoastMeBackComponent implements OnInit {
  readonly svc = inject(RoastMeBackService);

  readonly body = signal('');
  readonly authorName = signal('');
  readonly authorLink = signal('');

  readonly posting = signal(false);
  readonly justPosted = signal(false);

  readonly canSubmit = computed(() => this.body().trim().length >= 4);

  ngOnInit(): void {
    this.svc.load();
  }

  async submit(): Promise<void> {
    if (!this.canSubmit() || this.posting()) return;
    this.posting.set(true);
    const saved = await this.svc.submit(this.body(), this.authorName(), this.authorLink());
    this.posting.set(false);
    if (saved) {
      this.body.set('');
      this.justPosted.set(true);
      setTimeout(() => this.justPosted.set(false), 4000);
    }
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatReply(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const h = Math.round(mins / 60);
    if (h < 24) return `${h}h`;
    return `${Math.round(h / 24)}d`;
  }
}
