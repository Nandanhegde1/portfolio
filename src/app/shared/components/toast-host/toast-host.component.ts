import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-host" aria-live="polite" aria-atomic="true">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="toast"
          [class.toast--achievement]="t.variant === 'achievement'"
          [class.toast--success]="t.variant === 'success'"
          [class.toast--info]="t.variant === 'info'"
          [class.toast--error]="t.variant === 'error'"
          (click)="toast.dismiss(t.id)"
        >
          @if (t.emoji) { <span class="toast__emoji">{{ t.emoji }}</span> }
          <div class="toast__content">
            <strong class="toast__title">{{ t.title }}</strong>
            @if (t.message) { <p class="toast__msg">{{ t.message }}</p> }
          </div>
          <button class="toast__close" (click)="toast.dismiss(t.id); $event.stopPropagation()" aria-label="Dismiss">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-host {
      position: fixed;
      top: 80px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 9999;
      pointer-events: none;
      max-width: 380px;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: var(--card-bg, #fff);
      color: var(--text-primary, #1a1a2e);
      border: 1px solid var(--border, rgba(0,0,0,0.08));
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      cursor: pointer;
      animation: toastSlide 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
      min-width: 280px;
    }
    .toast--achievement {
      background: linear-gradient(135deg, #6c63ff, #ec4899);
      color: #fff;
      border-color: transparent;
      box-shadow: 0 12px 40px rgba(108, 99, 255, 0.45);
    }
    .toast--success { border-left: 4px solid #16a34a; }
    .toast--info { border-left: 4px solid #6c63ff; }
    .toast--error { border-left: 4px solid #f43f5e; }
    .toast__emoji { font-size: 1.6rem; line-height: 1; }
    .toast__content { flex: 1; }
    .toast__title { display: block; font-size: 0.95rem; font-weight: 700; margin-bottom: 2px; }
    .toast__msg { margin: 0; font-size: 0.82rem; opacity: 0.9; line-height: 1.4; }
    .toast__close {
      background: transparent;
      border: none;
      color: currentColor;
      font-size: 1.4rem;
      line-height: 1;
      cursor: pointer;
      opacity: 0.7;
      padding: 0 4px;
    }
    .toast__close:hover { opacity: 1; }
    @keyframes toastSlide {
      from { opacity: 0; transform: translateX(40px) scale(0.95); }
      to { opacity: 1; transform: translateX(0) scale(1); }
    }
    @media (max-width: 480px) {
      .toast-host { right: 12px; left: 12px; max-width: none; }
      .toast { min-width: 0; }
    }
  `],
})
export class ToastHostComponent {
  readonly toast = inject(ToastService);
}
