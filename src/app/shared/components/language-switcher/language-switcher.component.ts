import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageService } from '../../../core/i18n/language.service';
import { LangCode } from '../../../core/i18n/transloco.config';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lang" [class.lang--open]="open()">
      <button
        type="button"
        class="lang__trigger"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="'lang.label' | transloco"
        (click)="toggle($event)"
      >
        <span class="lang__flag" aria-hidden="true">{{ activeMeta().flag }}</span>
        <span class="lang__code">{{ activeMeta().code.toUpperCase() }}</span>
        <span class="lang__caret" aria-hidden="true">▾</span>
      </button>

      @if (open()) {
        <ul class="lang__menu" role="listbox" [attr.aria-label]="'lang.label' | transloco">
          @for (l of language.supported; track l.code) {
            <li>
              <button
                type="button"
                role="option"
                class="lang__option"
                [class.lang__option--active]="l.code === language.current()"
                [attr.aria-selected]="l.code === language.current()"
                (click)="pick(l.code)"
              >
                <span class="lang__flag" aria-hidden="true">{{ l.flag }}</span>
                <span class="lang__name">{{ l.label }}</span>
                @if (l.code === language.current()) {
                  <span class="lang__check" aria-hidden="true">✓</span>
                }
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  protected language = inject(LanguageService);
  private host = inject(ElementRef<HTMLElement>);
  readonly open = signal(false);

  activeMeta() {
    return (
      this.language.supported.find((l) => l.code === this.language.current()) ??
      this.language.supported[0]
    );
  }

  toggle(e: MouseEvent): void {
    e.stopPropagation();
    this.open.update((v) => !v);
  }

  pick(code: LangCode): void {
    this.language.set(code);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open()) this.open.set(false);
  }
}
