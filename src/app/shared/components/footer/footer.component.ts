import { Component, ChangeDetectionStrategy, signal, HostListener, OnInit } from '@angular/core';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__left">
          <span class="footer__logo" (click)="toggleEasterEgg()">&lt;NH/&gt;</span>
          @if (easterEgg()) {
            <p class="footer__easter-egg">🚀 sudo hire-me --force</p>
          } @else {
            <p class="footer__tagline">Building the web, one component at a time.</p>
          }
        </div>

        <div class="footer__social">
          <a href="https://github.com/Nandanhegde1/portfolio" target="_blank" rel="noopener" appTooltip="View this portfolio's source code" aria-label="View source on GitHub" class="footer__source">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>View Source</span>
          </a>
          <a href="https://github.com/nandanhegde" target="_blank" rel="noopener" appTooltip="GitHub profile" aria-label="GitHub profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a href="https://linkedin.com/in/nandan-hegde-195020168" target="_blank" rel="noopener" appTooltip="Connect on LinkedIn" aria-label="LinkedIn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a href="mailto:nandanhegde1096@gmail.com" appTooltip="Send me an email" aria-label="Email">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M22 4l-10 8L2 4"/>
            </svg>
          </a>
        </div>

        <div class="footer__bottom">
          <p>&copy; {{ currentYear }} Nandan Hegde. Built with Angular 19.</p>
          <p class="footer__deploy">
            <span class="footer__deploy-dot" aria-hidden="true"></span>
            Last deploy: {{ lastDeploy }}
          </p>
        </div>
      </div>

      @if (konamiUnlocked()) {
        <div class="footer__konami" role="status" aria-live="polite">
          🕹️ <strong>KONAMI UNLOCKED!</strong> +1 Stack Overflow rep · Try the terminal command <code>sudo hire-me</code>
        </div>
      }
    </footer>
  `,
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  readonly currentYear = new Date().getFullYear();
  readonly easterEgg = signal(false);
  readonly konamiUnlocked = signal(false);
  readonly lastDeploy = this.formatDeploy();

  // Konami: ↑ ↑ ↓ ↓ ← → ← → B A
  private readonly konami = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a',
  ];
  private buffer: string[] = [];

  ngOnInit(): void {
    if (localStorage.getItem('konami_unlocked') === '1') this.konamiUnlocked.set(true);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    this.buffer.push(e.key);
    if (this.buffer.length > this.konami.length) this.buffer.shift();
    if (this.buffer.join(',') === this.konami.join(',')) {
      this.konamiUnlocked.set(true);
      localStorage.setItem('konami_unlocked', '1');
      setTimeout(() => this.konamiUnlocked.set(false), 8000);
    }
  }

  toggleEasterEgg(): void {
    this.easterEgg.set(true);
    setTimeout(() => this.easterEgg.set(false), 3000);
  }

  private formatDeploy(): string {
    // Build-time injected via DEFINE-style or fall back to "today"
    // Using build date here is best-effort; will get baked at SSR/build.
    const d = new Date();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
