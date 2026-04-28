import { ApplicationConfig, provideAppInitializer, inject, provideZoneChangeDetection } from '@angular/core';
import {
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions,
  PreloadAllModules,
} from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideI18n } from './core/i18n/transloco.config';
import { LanguageService } from './core/i18n/language.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      // Preload all lazy chunks after initial nav so subsequent route clicks are instant.
      withPreloading(PreloadAllModules),
      // Restore scroll position on back/forward, jump to top on new nav.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      // Native View Transitions API for smooth route morphs (Chrome/Edge; falls back gracefully).
      withViewTransitions({ skipInitialTransition: true }),
    ),
    provideHttpClient(withFetch()),
    provideI18n(),
    // Restore the user's previously chosen language (or default 'en') before the app paints.
    provideAppInitializer(() => inject(LanguageService).init()),
  ],
};
