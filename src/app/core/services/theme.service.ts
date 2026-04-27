import { Injectable, signal } from '@angular/core';
import { ThemeName } from '../models';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'portfolio-theme';
  readonly currentTheme = signal<ThemeName>(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  setTheme(theme: ThemeName): void {
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  toggleDarkLight(): void {
    const next = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  private getInitialTheme(): ThemeName {
    const stored = localStorage.getItem(this.STORAGE_KEY) as ThemeName | null;
    if (stored) return stored;

    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  private applyTheme(theme: ThemeName): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}
