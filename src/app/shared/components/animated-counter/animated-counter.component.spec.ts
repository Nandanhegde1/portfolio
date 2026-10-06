import { TestBed } from '@angular/core/testing';
import { AnimatedCounterComponent } from './animated-counter.component';

/** Text a screen reader gets: each text node outside aria-hidden subtrees. */
function accessibleText(root: HTMLElement): string {
  const copy = root.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[aria-hidden="true"]').forEach((el) => el.remove());
  const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  while (walker.nextNode()) parts.push(walker.currentNode.textContent ?? '');
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

// Each digit is a reel of 0-9, so screen readers used to read
// "0 1 2 3 4 5 6 7 8 9" for every digit instead of the number.
describe('AnimatedCounterComponent', () => {
  function render(inputs: { targetValue: number; suffix?: string; label?: string }): HTMLElement {
    TestBed.configureTestingModule({ imports: [AnimatedCounterComponent] });
    const fixture = TestBed.createComponent(AnimatedCounterComponent);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('reads the final value and suffix once, not the digit reels', () => {
    const el = render({ targetValue: 15, suffix: '+' });
    expect(accessibleText(el)).toBe('15+');
    expect(el.querySelector('.counter__digits')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the label readable after the value', () => {
    const el = render({ targetValue: 2341, label: 'Bugs Squashed' });
    expect(accessibleText(el)).toBe('2341 Bugs Squashed');
  });
});
