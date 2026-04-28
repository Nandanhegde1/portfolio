import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { DEFAULT_LANG, LangCode, STORAGE_KEY, SUPPORTED_LANGS } from './transloco.config';

/**
 * Single source of truth for the active UI language.
 * - User-driven only (no navigator.language sniffing).
 * - Persists choice in localStorage so it survives reloads.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private transloco = inject(TranslocoService);
  readonly supported = SUPPORTED_LANGS;
  readonly current = signal<LangCode>(DEFAULT_LANG);

  init(): void {
    const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) as LangCode | null;
    const isValid = stored && this.supported.some((l) => l.code === stored);
    const lang = isValid ? stored! : DEFAULT_LANG;
    this.transloco.setActiveLang(lang);
    this.current.set(lang);
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }

  set(lang: LangCode): void {
    if (!this.supported.some((l) => l.code === lang)) return;
    this.transloco.setActiveLang(lang);
    this.current.set(lang);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }
}
