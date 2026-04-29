import {
  Component,
  input,
  signal,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';

@Component({
  selector: 'app-animated-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="counter" [class]="'counter--' + size()">
      <div class="counter__digits">
        @for (digit of displayDigits(); track $index) {
          <div class="counter__slot">
            <div class="counter__reel" [style.transform]="'translateY(-' + digit.offset + '%)'">
              @for (n of numbers; track n) {
                <span class="counter__num">{{ n }}</span>
              }
            </div>
          </div>
        }
      </div>
      @if (label()) {
        <span class="counter__label">{{ label() }}</span>
      }
    </div>
  `,
  styleUrl: './animated-counter.component.scss',
})
export class AnimatedCounterComponent implements OnInit, OnDestroy {
  readonly targetValue = input.required<number>();
  readonly label = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly duration = input(2000);

  readonly numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  readonly displayDigits = signal<{ value: number; offset: number }[]>([]);

  private animationFrame = 0;

  ngOnInit(): void {
    this.animateToTarget();
  }

  ngOnDestroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private animateToTarget(): void {
    const target = this.targetValue();
    const targetStr = target.toString();
    const digitCount = targetStr.length;
    const dur = this.duration();

    // Initialize at 0
    this.displayDigits.set(
      Array.from({ length: digitCount }, () => ({ value: 0, offset: 0 }))
    );

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / dur, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(eased * target);
      const currentStr = currentValue.toString().padStart(digitCount, '0');

      const digits = currentStr.split('').map(ch => {
        const v = parseInt(ch, 10);
        return { value: v, offset: v * 10 };
      });

      this.displayDigits.set(digits);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    // Small delay so the 0→target animation is visible
    setTimeout(() => {
      this.animationFrame = requestAnimationFrame(animate);
    }, 300);
  }
}
