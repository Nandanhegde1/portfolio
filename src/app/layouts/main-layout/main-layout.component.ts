import { Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, signal, NgZone, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent, FooterComponent, SocialSidebarComponent } from '../../shared/components';
import { CursorGlowComponent } from '../../shared/components/cursor-glow/cursor-glow.component';
import { TerminalShellComponent } from '../../features/terminal/terminal-shell.component';
import { SpotifyWidgetComponent } from '../../features/spotify/spotify-widget.component';
import { ToastHostComponent } from '../../shared/components/toast-host/toast-host.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, SocialSidebarComponent, CursorGlowComponent, TerminalShellComponent, SpotifyWidgetComponent, ToastHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a href="#main-content" class="skip-to-content">Skip to main content</a>

    <!-- Scroll progress bar -->
    <div class="scroll-progress" [style.width.%]="scrollProgress()"></div>

    <!-- Cursor glow trail (auto-disabled on touch + reduced-motion) -->
    <app-cursor-glow />

    <app-navbar />
    <app-social-sidebar />
    <main class="main-content" id="main-content" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />

    <!-- Global overlays -->
    <app-terminal-shell />
    <app-toast-host />

    <!-- Spotify widget fixed bottom-left -->
    <div class="spotify-fixed">
      <app-spotify-widget />
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      padding-top: 64px;
    }

    .spotify-fixed {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 50;
    }

    /* Ambient now-playing card overlaps content on small screens — desktop-only flourish */
    @media (max-width: 768px) {
      .spotify-fixed { display: none; }
    }
  `],
})
export class MainLayoutComponent implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  readonly scrollProgress = signal(0);
  private scrollHandler?: () => void;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.zone.runOutsideAngular(() => {
      this.scrollHandler = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        this.scrollProgress.set(Math.min(progress, 100));
      };
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);
  }
}
