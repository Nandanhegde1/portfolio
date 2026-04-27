import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { StatCardData } from '../../../core/models';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card" [style.--card-accent]="data().color ?? 'var(--accent)'">
      <div class="stat-card__icon">
        <span [innerHTML]="data().icon"></span>
      </div>
      <div class="stat-card__content">
        <span class="stat-card__value">{{ data().value }}</span>
        <span class="stat-card__label">{{ data().label }}</span>
      </div>
      @if (data().change !== undefined) {
        <div class="stat-card__change" [class.positive]="(data().change ?? 0) > 0" [class.negative]="(data().change ?? 0) < 0">
          {{ (data().change ?? 0) > 0 ? '+' : '' }}{{ data().change }}%
          @if (data().changeLabel) {
            <span class="stat-card__change-label">{{ data().changeLabel }}</span>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  readonly data = input.required<StatCardData>();
}
