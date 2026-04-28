import { Component, inject, signal, ChangeDetectionStrategy, ElementRef, viewChild, AfterViewInit, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { burstConfetti } from '../../shared/utils/confetti';
import { SoundService } from '../../core/services/sound.service';

type Step = 'name' | 'email' | 'subject' | 'message' | 'review' | 'sending' | 'done';

interface LogLine {
  kind: 'sys' | 'prompt' | 'user' | 'ok' | 'err' | 'hint';
  text: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="cli">
      <div class="cli__inner">
        <header class="cli__chrome">
          <div class="cli__chrome-dots">
            <span class="cli__dot cli__dot--r"></span>
            <span class="cli__dot cli__dot--y"></span>
            <span class="cli__dot cli__dot--g"></span>
          </div>
          <div class="cli__chrome-title">
            guest&#64;portfolio &mdash; ~/contact &mdash; <span class="cli__chrome-shell">zsh</span>
          </div>
          <div class="cli__chrome-actions">
            <button type="button" class="cli__chrome-btn" (click)="reset()" title="Restart session">restart</button>
            <a href="mailto:nandanhegde1096&#64;gmail.com" class="cli__chrome-btn cli__chrome-btn--alt" title="Open email client">
              fallback &rarr; email
            </a>
          </div>
        </header>

        <div class="cli__layout">
          <div class="cli__terminal" #scroller>
            @for (line of log(); track $index) {
              <div class="cli__line cli__line--{{ line.kind }}">
                @if (line.kind === 'prompt' || line.kind === 'user') {
                  <span class="cli__sigil">{{ line.kind === 'prompt' ? '?' : '$' }}</span>
                }
                @if (line.kind === 'ok') {
                  <span class="cli__sigil cli__sigil--ok">[ok]</span>
                }
                @if (line.kind === 'err') {
                  <span class="cli__sigil cli__sigil--err">[err]</span>
                }
                @if (line.kind === 'sys') {
                  <span class="cli__sigil cli__sigil--sys">::</span>
                }
                @if (line.kind === 'hint') {
                  <span class="cli__sigil cli__sigil--hint">&rarr;</span>
                }
                <span class="cli__text">{{ line.text }}</span>
              </div>
            }

            @if (step() !== 'sending' && step() !== 'done') {
              <form class="cli__active" [formGroup]="form" (ngSubmit)="advance()">
                <span class="cli__active-sigil">&gt;</span>
                <span class="cli__active-label">{{ promptFor(step()) }}</span>

                @if (step() === 'message') {
                  <textarea
                    #activeInput
                    class="cli__input cli__input--multi"
                    formControlName="message"
                    rows="3"
                    placeholder="type your message, then press Ctrl+Enter"
                    (keydown.control.enter)="advance()"
                    (keydown.meta.enter)="advance()"
                  ></textarea>
                } @else if (step() === 'review') {
                  <button type="submit" class="cli__send" [disabled]="form.invalid || submitting()">
                    press <kbd>Enter</kbd> to send &uarr;
                  </button>
                } @else if (step() === 'name') {
                  <input #activeInput type="text" class="cli__input" formControlName="name" placeholder="e.g. Ada Lovelace" autocomplete="off" spellcheck="false" (keydown.enter)="$event.preventDefault(); advance()" />
                } @else if (step() === 'email') {
                  <input #activeInput type="email" class="cli__input" formControlName="email" placeholder="you&#64;company.com" autocomplete="off" spellcheck="false" (keydown.enter)="$event.preventDefault(); advance()" />
                } @else if (step() === 'subject') {
                  <input #activeInput type="text" class="cli__input" formControlName="subject" placeholder="collab / role / question" autocomplete="off" spellcheck="false" (keydown.enter)="$event.preventDefault(); advance()" />
                }
                <button type="submit" class="cli__submit-hidden" tabindex="-1" aria-hidden="true"></button>
                <span class="cli__caret" aria-hidden="true"></span>
              </form>

              @if (currentError(); as e) {
                <div class="cli__line cli__line--err">
                  <span class="cli__sigil cli__sigil--err">[err]</span>
                  <span class="cli__text">{{ e }}</span>
                </div>
              }
            }

            @if (step() === 'sending') {
              <div class="cli__sending">
                <span class="cli__spinner" aria-hidden="true"></span>
                <span>POST /api/contact &mdash; awaiting response&hellip;</span>
              </div>
            }

            @if (step() === 'done') {
              <div class="cli__done">
                <button type="button" class="cli__send" (click)="reset()">
                  &uarr; new session
                </button>
              </div>
            }
          </div>

          <aside class="cli__sidecard">
            <div class="cli__sidecard-block">
              <div class="cli__sidecard-label">// session</div>
              <div class="cli__sidecard-row"><span>step</span><strong>{{ stepNumber() }}/4</strong></div>
              <div class="cli__sidecard-row"><span>started</span><strong>{{ startedAt }}</strong></div>
              <div class="cli__sidecard-row"><span>shell</span><strong>zsh 5.9</strong></div>
            </div>

            <div class="cli__sidecard-block">
              <div class="cli__sidecard-label">// captured</div>
              <dl class="cli__captured">
                <dt>name</dt><dd>{{ form.value.name || '_' }}</dd>
                <dt>email</dt><dd>{{ form.value.email || '_' }}</dd>
                <dt>subject</dt><dd>{{ form.value.subject || '_' }}</dd>
                <dt>message</dt><dd>{{ form.value.message ? truncate(form.value.message, 40) : '_' }}</dd>
              </dl>
            </div>

            <div class="cli__sidecard-block">
              <div class="cli__sidecard-label">// shortcuts</div>
              <div class="cli__shortcut"><kbd>Enter</kbd> next field</div>
              <div class="cli__shortcut"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> send (multi-line)</div>
              <div class="cli__shortcut">click <code>restart</code> to reset</div>
            </div>

            <div class="cli__sidecard-block cli__sidecard-block--alt">
              <div class="cli__sidecard-label">// elsewhere</div>
              <a href="mailto:nandanhegde1096&#64;gmail.com">email me directly &rarr;</a>
              <a href="https://github.com/Nandanhegde1" target="_blank" rel="noopener">github.com/Nandanhegde1 &rarr;</a>
              <a href="https://www.linkedin.com/in/nandan-hegde-3a7370166/" target="_blank" rel="noopener">linkedin &rarr;</a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `,
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly sound = inject(SoundService);

  readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  readonly activeInput = viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('activeInput');

  readonly step = signal<Step>('name');
  readonly submitting = signal(false);
  readonly currentError = signal<string | null>(null);
  readonly log = signal<LogLine[]>([
    { kind: 'sys', text: 'session opened — fastest way to reach me. answers usually in <24h.' },
    { kind: 'hint', text: 'press Enter after each field. type your message, then Ctrl+Enter to send.' },
  ]);

  readonly form = this.fb.nonNullable.group({
    name:    ['', [Validators.required, Validators.minLength(2)]],
    email:   ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.minLength(2)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  readonly startedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  readonly stepNumber = computed(() => {
    const s = this.step();
    if (s === 'name') return 1;
    if (s === 'email') return 2;
    if (s === 'subject') return 3;
    return 4;
  });

  ngAfterViewInit(): void {
    setTimeout(() => this.focusInput(), 0);
  }

  promptFor(s: Step): string {
    switch (s) {
      case 'name':    return 'who is this?';
      case 'email':   return 'where do I reply?';
      case 'subject': return 'topic in 4-6 words?';
      case 'message': return 'what do you want to say?';
      case 'review':  return 'send the message?';
      default:        return '';
    }
  }

  truncate(s: string, n: number): string {
    return s.length > n ? s.slice(0, n - 1).trim() + '…' : s;
  }

  advance(): void {
    const s = this.step();
    if (s === 'sending' || s === 'done') return;

    if (s === 'review') { this.send(); return; }

    const ctrl: AbstractControl | null = this.form.get(s);
    if (!ctrl || ctrl.invalid) {
      this.currentError.set(this.errorFor(s));
      this.sound.play('error');
      return;
    }
    this.currentError.set(null);

    this.log.update(l => [
      ...l,
      { kind: 'prompt', text: this.promptFor(s) },
      { kind: 'user', text: s === 'message' ? this.truncate(String(ctrl.value), 80) : String(ctrl.value) },
    ]);
    this.sound.play('click');

    const next: Step =
      s === 'name'    ? 'email'   :
      s === 'email'   ? 'subject' :
      s === 'subject' ? 'message' :
                        'review';
    this.step.set(next);
    // Use setTimeout(0) so Angular renders the new input element before we try to focus it.
    // queueMicrotask runs before the DOM update for the new @if branch, so the new input
    // wouldn't exist yet and focus() would silently no-op.
    setTimeout(() => { this.scrollToBottom(); this.focusInput(); }, 0);
  }

  private errorFor(s: Step): string {
    const ctrl = this.form.get(s);
    if (!ctrl) return 'invalid input';
    if (ctrl.hasError('required')) return `${s} is required.`;
    if (ctrl.hasError('email')) return `that email doesn't look right.`;
    if (ctrl.hasError('minlength')) {
      const need = ctrl.getError('minlength').requiredLength;
      return `${s} needs at least ${need} characters.`;
    }
    return `invalid ${s}.`;
  }

  private send(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.step.set('sending');
    const t0 = performance.now();

    this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}/api/contact`,
      this.form.getRawValue(),
    ).subscribe({
      next: () => {
        const ms = Math.round(performance.now() - t0);
        this.log.update(l => [...l, { kind: 'ok', text: `message delivered in ${ms}ms — talk soon.` }]);
        this.submitting.set(false);
        this.step.set('done');
        this.sound.play('unlock');
        burstConfetti({ count: 90, spread: 90 });
        queueMicrotask(() => this.scrollToBottom());
      },
      error: (err) => {
        const ms = Math.round(performance.now() - t0);
        this.log.update(l => [
          ...l,
          { kind: 'err', text: `request failed after ${ms}ms — ${err?.error?.error || 'backend offline'}.` },
          { kind: 'hint', text: 'fallback: email me directly via the link in the chrome bar.' },
        ]);
        this.submitting.set(false);
        this.step.set('review');
        this.sound.play('error');
        queueMicrotask(() => this.scrollToBottom());
      },
    });
  }

  reset(): void {
    this.form.reset({ name: '', email: '', subject: '', message: '' });
    this.currentError.set(null);
    this.step.set('name');
    this.log.set([
      { kind: 'sys', text: 'session reset.' },
      { kind: 'hint', text: 'press Enter after each field. type your message, then Ctrl+Enter to send.' },
    ]);
    setTimeout(() => this.focusInput(), 0);
  }

  private scrollToBottom(): void {
    const el = this.scroller()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private focusInput(): void {
    this.activeInput()?.nativeElement.focus();
  }
}