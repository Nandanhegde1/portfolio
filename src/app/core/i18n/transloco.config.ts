import { HttpClient } from '@angular/common/http';
import { Injectable, inject, isDevMode, makeEnvironmentProviders } from '@angular/core';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@jsverse/transloco';

export const SUPPORTED_LANGS = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'es', label: 'Español',  flag: '🇪🇸' },
  { code: 'hi', label: 'हिन्दी',   flag: '🇮🇳' },
  { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
  { code: 'ja', label: '日本語',    flag: '🇯🇵' },
] as const;

export type LangCode = typeof SUPPORTED_LANGS[number]['code'];

export const STORAGE_KEY = 'nh.lang';
export const DEFAULT_LANG: LangCode = 'en';

@Injectable({ providedIn: 'root' })
export class I18nHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  // Strip the deploy base href so requests work on GitHub Pages (/portfolio/) and locally (/).
  private readonly base = (() => {
    const b = document.querySelector('base')?.getAttribute('href') ?? '/';
    return b.endsWith('/') ? b : `${b}/`;
  })();

  getTranslation(lang: string) {
    return this.http.get<Translation>(`${this.base}assets/i18n/${lang}.json`);
  }
}

export function provideI18n() {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: SUPPORTED_LANGS.map((l) => l.code),
        defaultLang: DEFAULT_LANG,
        fallbackLang: DEFAULT_LANG,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: { allowEmpty: true, useFallbackTranslation: true, logMissingKey: false },
      },
      loader: I18nHttpLoader,
    }),
  ]);
}
