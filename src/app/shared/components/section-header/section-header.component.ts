import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="section-header">
      <span class="section-header__tag">{{ tag() }}</span>
      <h2 class="section-header__title">{{ title() }}</h2>
      @if (subtitle()) {
        <p class="section-header__subtitle">{{ subtitle() }}</p>
      }
    </div>
  `,
  styleUrl: './section-header.component.scss',
})
export class SectionHeaderComponent {
  readonly tag = input('');
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
