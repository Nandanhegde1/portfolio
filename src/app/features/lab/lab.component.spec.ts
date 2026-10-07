import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AgentTraceFile } from '../../core/models';
import { LabComponent } from './lab.component';
import traces from '../../../assets/data/agent-traces.json';

const file = traces as unknown as AgentTraceFile;

const text = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** Clicks Step until the first event of the given kind in the first run has been applied. */
function stepTo(el: HTMLElement, fixture: ComponentFixture<LabComponent>, kind: string): void {
  const step = Array.from(el.querySelectorAll<HTMLButtonElement>('.lab__controls button')).find((b) => text(b) === 'Step')!;
  const upTo = file.runs[0].events.findIndex((e) => e.kind === kind);
  for (let i = 0; i <= upTo; i++) {
    step.click();
    fixture.detectChanges();
  }
}

function render(): ComponentFixture<LabComponent> {
  TestBed.configureTestingModule({
    imports: [LabComponent],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(LabComponent);
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  http.expectOne('assets/data/agent-traces.json').flush(file);
  http.verify();
  fixture.detectChanges();
  return fixture;
}

// The lab is a replay of recorded runs, so the page must say so up front, and
// offer exactly the runs the file holds: one question chip per recorded run.
describe('LabComponent', () => {
  let fixture: ComponentFixture<LabComponent>;
  let el: HTMLElement;

  beforeEach(() => {
    fixture = render();
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => fixture.destroy());

  it('renders one question chip per recorded run', () => {
    const chips = el.querySelectorAll('.lab__picker button');
    expect(chips.length).toBe(file.runs.length);
    expect(chips[0].getAttribute('aria-pressed')).toBe('true');
    expect(text(el.querySelector('.lab__question-text'))).toBe(file.runs[0].question);
  });

  it('says near the top that this is a recorded run and that no model is called', () => {
    expect(text(el.querySelector('[data-testid="honesty"]'))).toBe(
      'A recorded run from the live Planning Desk app on 7 October 2026, replayed in your browser. No model is called from this page.',
    );
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('.lab__links a'));
    expect(links.map((a) => [text(a), a.href])).toEqual([
      ['Try the live app', 'https://planning-desk.onrender.com/'],
      ['Source', 'https://github.com/Nandanhegde1/planning-desk'],
    ]);
  });

  it('labels the three MCP server nodes from the data', () => {
    const labels = Array.from(el.querySelectorAll('.lab__node-label')).map((n) => text(n));
    for (const server of file.servers) expect(labels).toContain(server.label);
  });

  it('steps through a run to its answer and ends on the recorded totals', () => {
    const run = file.runs[0];
    const stepButton = Array.from(el.querySelectorAll<HTMLButtonElement>('.lab__controls button')).find(
      (b) => text(b) === 'Step',
    )!;
    expect(text(el.querySelector('.lab__answer'))).toBe('');

    stepButton.click();
    fixture.detectChanges();
    expect(text(el.querySelector('.lab__narration'))).toBe('Step 1: the loop asks the model what to do');

    for (let i = 1; i < run.events.length; i++) {
      stepButton.click();
      fixture.detectChanges();
    }
    // aria-disabled, so the button keeps keyboard focus at the end of the run.
    expect(stepButton.getAttribute('aria-disabled')).toBe('true');
    expect(stepButton.disabled).toBeFalse();
    const final = run.events[run.events.length - 1];
    expect(text(el.querySelector('.lab__answer'))).toBe(final.kind === 'final' ? final.text : '');
    const counters = Array.from(el.querySelectorAll('.lab__counter-value')).map((n) => text(n));
    expect(counters).toEqual([
      `${run.done?.steps} / ${file.ceilings?.steps}`,
      `${run.done?.toolCalls} / ${file.ceilings?.toolCalls}`,
      `${(run.done?.tokens ?? 0).toLocaleString('en-US')} / ${(file.ceilings?.tokens ?? 0).toLocaleString('en-US')}`,
      `${(run.totalMs / 1000).toFixed(1)} s / ${file.ceilings?.turnSeconds} s`,
    ]);
    expect(el.querySelectorAll('.lab__timing').length).toBe(run.done?.toolCalls as number);
  });

  it('sends a packet along the edge of a tool call in flight', () => {
    stepTo(el, fixture, 'tool_call');
    expect(el.querySelectorAll('.lab__edge--walking').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('.lab__packet').length).toBeGreaterThan(0);
  });

  it('switches runs from the picker and starts playing', () => {
    const chips = el.querySelectorAll<HTMLButtonElement>('.lab__picker button');
    chips[1].click();
    fixture.detectChanges();
    expect(chips[1].getAttribute('aria-pressed')).toBe('true');
    expect(text(el.querySelector('.lab__question-text'))).toBe(file.runs[1].question);
    const play = el.querySelector<HTMLButtonElement>('.lab__btn--primary')!;
    expect(text(play)).toBe('Pause');
  });
});

// With reduced motion asked for, nothing travels: no packets are drawn, but the
// stepper still works and the active edge stays marked.
describe('LabComponent with reduced motion', () => {
  it('draws no packets and still marks the edge of a tool call in flight', () => {
    spyOn(window, 'matchMedia').and.callFake(
      (query: string) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    stepTo(el, fixture, 'tool_call');
    expect(el.querySelectorAll('.lab__edge--walking').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('.lab__packet').length).toBe(0);
    fixture.destroy();
  });
});
