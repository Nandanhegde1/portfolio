import { Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2, inject } from '@angular/core';

/**
 * Lightweight tooltip directive — usage: <button appTooltip="Helpful hint">…</button>
 * Renders a styled bubble on hover/focus, auto-positioned above the element.
 */
@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') text = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private bubble: HTMLDivElement | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  @HostListener('mouseenter') onEnter(): void { this.show(); }
  @HostListener('focus') onFocus(): void { this.show(); }
  @HostListener('mouseleave') onLeave(): void { this.scheduleHide(); }
  @HostListener('blur') onBlur(): void { this.scheduleHide(); }
  @HostListener('click') onClick(): void { this.hide(); }

  private show(): void {
    if (!this.text || this.bubble) return;
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }

    const el = this.host.nativeElement;
    const rect = el.getBoundingClientRect();

    const bubble = this.renderer.createElement('div') as HTMLDivElement;
    bubble.className = `app-tooltip app-tooltip--${this.tooltipPosition}`;
    bubble.textContent = this.text;
    bubble.setAttribute('role', 'tooltip');
    document.body.appendChild(bubble);
    this.bubble = bubble;

    // Position after layout so we have width/height
    requestAnimationFrame(() => {
      if (!this.bubble) return;
      const b = this.bubble.getBoundingClientRect();
      let top = 0, left = 0;
      switch (this.tooltipPosition) {
        case 'bottom':
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2 - b.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - b.height / 2;
          left = rect.left - b.width - 8;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - b.height / 2;
          left = rect.right + 8;
          break;
        default: // top
          top = rect.top - b.height - 8;
          left = rect.left + rect.width / 2 - b.width / 2;
      }
      // Clamp to viewport
      left = Math.max(8, Math.min(window.innerWidth - b.width - 8, left));
      top = Math.max(8, top);
      this.bubble.style.top = `${top + window.scrollY}px`;
      this.bubble.style.left = `${left + window.scrollX}px`;
      this.bubble.classList.add('app-tooltip--visible');
    });
  }

  private scheduleHide(): void {
    this.hideTimer = setTimeout(() => this.hide(), 100);
  }

  private hide(): void {
    if (this.bubble) {
      this.bubble.remove();
      this.bubble = null;
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
