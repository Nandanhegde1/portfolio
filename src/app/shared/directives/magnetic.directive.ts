import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';

/**
 * Magnetic button effect — element subtly tracks cursor when hovered.
 * Used on hero CTAs for delightful micro-interaction.
 * Respects prefers-reduced-motion.
 */
@Directive({
  selector: '[appMagnetic]',
  standalone: true,
})
export class MagneticDirective {
  @Input() magneticStrength = 0.35;
  @Input() magneticRadius = 60;

  private readonly host = inject(ElementRef<HTMLElement>);
  private rect: DOMRect | null = null;
  private reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  @HostListener('mouseenter') onEnter(): void {
    if (this.reduced) return;
    this.rect = this.host.nativeElement.getBoundingClientRect();
  }

  @HostListener('mousemove', ['$event']) onMove(e: MouseEvent): void {
    if (this.reduced || !this.rect) return;
    const cx = this.rect.left + this.rect.width / 2;
    const cy = this.rect.top + this.rect.height / 2;
    const dx = (e.clientX - cx) * this.magneticStrength;
    const dy = (e.clientY - cy) * this.magneticStrength;
    this.host.nativeElement.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  @HostListener('mouseleave') onLeave(): void {
    this.host.nativeElement.style.transform = '';
    this.rect = null;
  }
}
