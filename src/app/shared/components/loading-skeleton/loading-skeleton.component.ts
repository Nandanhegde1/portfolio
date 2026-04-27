import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-wrapper">
      @for (row of rows(); track $index) {
        <div class="skeleton" [style.width]="row.width" [style.height]="row.height"></div>
      }
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton {
      background: linear-gradient(
        90deg,
        var(--bg-tertiary) 25%,
        var(--bg-secondary) 50%,
        var(--bg-tertiary) 75%
      );
      background-size: 400% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: 8px;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `],
})
export class LoadingSkeletonComponent {
  readonly rows = input<{ width: string; height: string }[]>([
    { width: '100%', height: '20px' },
    { width: '80%', height: '20px' },
    { width: '60%', height: '20px' },
  ]);
}
