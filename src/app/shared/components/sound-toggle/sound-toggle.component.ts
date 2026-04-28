import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SoundService } from '../../../core/services/sound.service';

@Component({
  selector: 'app-sound-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="snd"
      [class.snd--on]="sound.enabled()"
      (click)="sound.toggle()"
      [attr.aria-pressed]="sound.enabled()"
      [attr.aria-label]="sound.enabled() ? 'Disable UI sound effects' : 'Enable UI sound effects'"
      title="UI sounds">
      @if (sound.enabled()) {
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      }
    </button>
  `,
  styles: [`
    .snd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      background: transparent;
      border: 1px solid var(--border, rgba(255,255,255,0.12));
      border-radius: 10px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }
    .snd:hover { color: var(--text-primary); border-color: var(--accent); transform: translateY(-1px); }
    .snd--on { color: var(--accent); border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent); }
  `],
})
export class SoundToggleComponent {
  protected readonly sound = inject(SoundService);
}
