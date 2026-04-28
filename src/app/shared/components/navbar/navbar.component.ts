import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../core/services';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="navbar">
      <div class="navbar__inner">
        <a routerLink="/" class="navbar__logo">
          <span class="navbar__logo-bracket">&lt;</span>
          <span class="navbar__logo-name">NH</span>
          <span class="navbar__logo-bracket">/&gt;</span>
        </a>

        <a
          routerLink="/contact"
          class="navbar__status"
          title="Currently open to senior frontend, full-stack & lead roles"
          aria-label="Open to opportunities — click to contact"
        >
          <span class="navbar__status-dot" aria-hidden="true"></span>
          <span class="navbar__status-text">Open to work</span>
        </a>

        <ul class="navbar__links">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a></li>
          <li><a routerLink="/about" routerLinkActive="active">About</a></li>
          <li><a routerLink="/dashboard" routerLinkActive="active">Dashboard</a></li>
          <li><a routerLink="/blog" routerLinkActive="active">Blog</a></li>
          <li><a routerLink="/under-the-hood" routerLinkActive="active">Under the Hood</a></li>
          <li class="navbar__dropdown">
            <button class="navbar__dropdown-trigger" (click)="dropdownOpen = !dropdownOpen">
              Play \u25BE
            </button>
            @if (dropdownOpen) {
              <ul class="navbar__dropdown-menu">
                <li><a routerLink="/roast" routerLinkActive="active" (click)="dropdownOpen = false">\uD83D\uDD25 Roast My Stack</a></li>
                <li><a routerLink="/quiz" routerLinkActive="active" (click)="dropdownOpen = false">\uD83C\uDFAF Team Quiz</a></li>
              </ul>
            }
          </li>
          <li><a routerLink="/guestbook" routerLinkActive="active">Guestbook</a></li>
          <li><a routerLink="/contact" routerLinkActive="active">Contact</a></li>
        </ul>

        <div class="navbar__actions">
          <button
            class="navbar__theme-toggle"
            [class.navbar__theme-toggle--spin]="themeSpinning"
            (click)="toggleTheme()"
            [appTooltip]="themeService.currentTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            aria-label="Toggle theme"
          >
            @if (themeService.currentTheme() === 'dark') {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            } @else {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            }
          </button>

          <button class="navbar__mobile-toggle" [class.navbar__mobile-toggle--open]="mobileOpen" (click)="toggleMobile()" appTooltip="Open menu" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      @if (mobileOpen) {
        <div class="navbar__mobile-overlay" (click)="mobileOpen = false"></div>
        <ul class="navbar__mobile-menu">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="mobileOpen = false">Home</a></li>
          <li><a routerLink="/about" routerLinkActive="active" (click)="mobileOpen = false">About</a></li>
          <li><a routerLink="/dashboard" routerLinkActive="active" (click)="mobileOpen = false">Dashboard</a></li>
          <li><a routerLink="/blog" routerLinkActive="active" (click)="mobileOpen = false">Blog</a></li>
          <li><a routerLink="/under-the-hood" routerLinkActive="active" (click)="mobileOpen = false">Under the Hood</a></li>
          <li><a routerLink="/roast" routerLinkActive="active" (click)="mobileOpen = false">\uD83D\uDD25 Roast My Stack</a></li>
          <li><a routerLink="/quiz" routerLinkActive="active" (click)="mobileOpen = false">\uD83C\uDFAF Team Quiz</a></li>
          <li><a routerLink="/guestbook" routerLinkActive="active" (click)="mobileOpen = false">Guestbook</a></li>
          <li><a routerLink="/contact" routerLinkActive="active" (click)="mobileOpen = false">Contact</a></li>
        </ul>
      }
    </nav>
  `,
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  readonly themeService = inject(ThemeService);
  themeSpinning = false;
  dropdownOpen = false;
  mobileOpen = false;

  toggleTheme(): void {
    this.themeSpinning = true;
    this.themeService.toggleDarkLight();
    setTimeout(() => (this.themeSpinning = false), 600);
  }

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }
}
