import { computed, signal } from '@angular/core';
import {
  TraceEvent,
  TraceFileEvent,
  TraceFinalEvent,
  TraceToolCallEvent,
  TraceToolResultEvent,
} from '../../core/models';

export type ReplaySpeed = 1 | 2 | 4;
export const REPLAY_SPEEDS: readonly ReplaySpeed[] = [1, 2, 4];

/** Real time between clock ticks while playing; each tick moves the replay clock by this times the speed. */
export const REPLAY_TICK_MS = 50;

/**
 * Plays a recorded turn back on its own clock. Events fire at their recorded
 * arrival time (tMs), scaled by the speed. Nothing here knows about the page:
 * the component reads the signals and derives what to draw with replayState().
 */
export class TraceReplay {
  readonly events: readonly TraceEvent[];
  /** Where the clock stops: the run's total time, or the last event if later. */
  readonly totalMs: number;

  private readonly _cursor = signal(0);
  private readonly _elapsedMs = signal(0);
  private readonly _playing = signal(false);
  private readonly _speed = signal<ReplaySpeed>(1);
  private readonly _batchStart = signal(0);

  /** How many events have been applied. */
  readonly cursor = this._cursor.asReadonly();
  readonly elapsedMs = this._elapsedMs.asReadonly();
  readonly playing = this._playing.asReadonly();
  readonly speed = this._speed.asReadonly();
  readonly finished = computed(() => this._cursor() >= this.events.length);
  /** The events applied by the latest tick or step, in order. */
  readonly lastBatch = computed(() => this.events.slice(this._batchStart(), this._cursor()));

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(events: readonly TraceEvent[], totalMs = 0) {
    // Stable sort on arrival time: events that arrived together keep their recorded order.
    this.events = events
      .map((event, i) => ({ event, i }))
      .sort((a, b) => a.event.tMs - b.event.tMs || a.i - b.i)
      .map(({ event }) => event);
    const last = this.events.length ? this.events[this.events.length - 1].tMs : 0;
    this.totalMs = Math.max(totalMs, last);
  }

  play(): void {
    if (this._playing()) return;
    if (this.finished()) this.rewind();
    this._playing.set(true);
    this.timer = setInterval(() => this.advance(REPLAY_TICK_MS * this._speed()), REPLAY_TICK_MS);
  }

  pause(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this._playing.set(false);
  }

  toggle(): void {
    if (this._playing()) this.pause();
    else this.play();
  }

  /** Back to the start, stopped. */
  rewind(): void {
    this.pause();
    this._cursor.set(0);
    this._batchStart.set(0);
    this._elapsedMs.set(0);
  }

  /** From the start again, playing. */
  replay(): void {
    this.rewind();
    this.play();
  }

  /** Pauses, then applies the next event and moves the clock to it. */
  step(): void {
    this.pause();
    if (this.finished()) return;
    const cursor = this._cursor();
    const next = this.events[cursor];
    this._batchStart.set(cursor);
    this._cursor.set(cursor + 1);
    this._elapsedMs.set(Math.max(this._elapsedMs(), next.tMs));
    if (this.finished()) this._elapsedMs.set(this.totalMs);
  }

  setSpeed(speed: ReplaySpeed): void {
    this._speed.set(speed);
  }

  /** Moves the clock forward by ms of recorded time and applies every event now due. */
  advance(ms: number): void {
    const elapsed = Math.min(this.totalMs, this._elapsedMs() + ms);
    const start = this._cursor();
    let cursor = start;
    while (cursor < this.events.length && this.events[cursor].tMs <= elapsed) cursor++;
    if (cursor > start) {
      this._batchStart.set(start);
      this._cursor.set(cursor);
    }
    this._elapsedMs.set(cursor >= this.events.length ? this.totalMs : elapsed);
    if (cursor >= this.events.length) this.pause();
  }

  destroy(): void {
    this.pause();
  }
}

export interface ToolCallState {
  call: TraceToolCallEvent;
  result: TraceToolResultEvent | null;
}

export interface ReplayState {
  /** The latest loop step that has started (0 before the first). */
  step: number;
  /** Tool calls made so far. */
  toolCalls: number;
  /** Cumulative tokens for the turn, as last reported; null before the first model reply. */
  tokens: number | null;
  /** A model call is in flight: its step started and its usage has not arrived. */
  modelBusy: boolean;
  /** Model latency of the latest finished model call, when recorded. */
  lastModelMs: number | null;
  /** Arrival time of the latest model reply. */
  lastModelAt: number | null;
  /** Every tool call made so far, with its result once it has arrived. */
  calls: ToolCallState[];
  files: TraceFileEvent[];
  final: TraceFinalEvent | null;
}

/** What the first `cursor` events of a run add up to. */
export function replayState(events: readonly TraceEvent[], cursor: number): ReplayState {
  const state: ReplayState = {
    step: 0,
    toolCalls: 0,
    tokens: null,
    modelBusy: false,
    lastModelMs: null,
    lastModelAt: null,
    calls: [],
    files: [],
    final: null,
  };
  const byIndex = new Map<number, ToolCallState>();
  for (const event of events.slice(0, cursor)) {
    switch (event.kind) {
      case 'step':
        state.step = Math.max(state.step, event.step);
        state.modelBusy = true;
        break;
      case 'tokens':
        // Cumulative for the turn: take the value, never add it up.
        state.tokens = event.tokens;
        state.modelBusy = false;
        state.lastModelMs = event.modelMs ?? null;
        state.lastModelAt = event.tMs;
        break;
      case 'tool_call': {
        const entry: ToolCallState = { call: event, result: null };
        byIndex.set(event.index, entry);
        state.calls.push(entry);
        state.toolCalls++;
        break;
      }
      case 'tool_result': {
        const entry = byIndex.get(event.index);
        if (entry) entry.result = event;
        break;
      }
      case 'file':
        state.files.push(event);
        break;
      case 'final':
        state.final = event;
        state.modelBusy = false;
        break;
    }
  }
  return state;
}

const numberFormat = new Intl.NumberFormat('en-US');

export function formatNumber(n: number): string {
  return numberFormat.format(n);
}

/** One short line per event, for the live region. */
export function describeEvent(event: TraceEvent): string {
  const at = `Step ${event.step}: `;
  switch (event.kind) {
    case 'step':
      return `${at}the loop asks the model what to do`;
    case 'tokens':
      return event.modelMs != null
        ? `${at}model replied in ${formatNumber(event.modelMs)} ms, ${formatNumber(event.tokens)} tokens so far`
        : `${at}model replied, ${formatNumber(event.tokens)} tokens so far`;
    case 'tool_call':
      return `${at}calling ${event.server}.${event.tool}`;
    case 'tool_result':
      return `${at}${event.server}.${event.tool}, ${formatNumber(event.durationMs)} ms${event.ok ? '' : ', failed'}`;
    case 'file':
      return `${at}file produced${event.filename ? `, ${event.filename}` : ''}`;
    case 'final':
      return `${at}final answer`;
  }
}
