import {
  Directive,
  ElementRef,
  inject,
  input,
  OnInit,
  OnDestroy,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  /** Animation delay in ms */
  readonly delay = input(0);
  /** Animation type */
  readonly animation = input<'fade-up' | 'fade-left' | 'fade-right' | 'scale'>('fade-up');

  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    const nativeEl = this.el.nativeElement;

    // Set initial hidden state
    this.renderer.setStyle(nativeEl, 'opacity', '0');
    this.renderer.setStyle(nativeEl, 'transition', `opacity 0.6s ease, transform 0.6s ease`);
    this.renderer.setStyle(nativeEl, 'transition-delay', `${this.delay()}ms`);

    switch (this.animation()) {
      case 'fade-up':
        this.renderer.setStyle(nativeEl, 'transform', 'translateY(30px)');
        break;
      case 'fade-left':
        this.renderer.setStyle(nativeEl, 'transform', 'translateX(-30px)');
        break;
      case 'fade-right':
        this.renderer.setStyle(nativeEl, 'transform', 'translateX(30px)');
        break;
      case 'scale':
        this.renderer.setStyle(nativeEl, 'transform', 'scale(0.95)');
        break;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.renderer.setStyle(nativeEl, 'opacity', '1');
            this.renderer.setStyle(nativeEl, 'transform', 'none');
            this.observer?.unobserve(nativeEl);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    this.observer.observe(nativeEl);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
