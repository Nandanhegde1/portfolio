import { fakeAsync, tick } from '@angular/core/testing';
import { AgentTraceFile, TraceEvent } from '../../core/models';
import { REPLAY_TICK_MS, TraceReplay, describeEvent, replayState } from './trace-replay';
import traces from '../../../assets/data/agent-traces.json';

const file = traces as unknown as AgentTraceFile;

// A small turn, listed out of order on purpose: two tool calls that arrived in
// the same frame burst, then their results, then the answer.
const events: TraceEvent[] = [
  { tMs: 400, kind: 'final', step: 2, text: 'done' },
  { tMs: 100, kind: 'step', step: 1, text: 'thinking' },
  { tMs: 200, kind: 'tool_call', step: 1, index: 1, server: 'fx', tool: 'get_rate_series' },
  { tMs: 200, kind: 'tool_call', step: 1, index: 2, server: 'discovery', tool: 'web_search' },
  { tMs: 300, kind: 'tool_result', step: 1, index: 1, server: 'fx', tool: 'get_rate_series', durationMs: 90, ok: true },
  { tMs: 300, kind: 'tool_result', step: 1, index: 2, server: 'discovery', tool: 'web_search', durationMs: 95, ok: false },
];

// Pins the replay clock: arrival order, pause, step, speed, and stopping on the
// run's own total time once the final event lands.
describe('TraceReplay', () => {
  it('replays events in arrival order, keeping the recorded order of events that arrived together', fakeAsync(() => {
    const replay = new TraceReplay(events, 450);
    expect(replay.events.map((e) => e.kind)).toEqual(['step', 'tool_call', 'tool_call', 'tool_result', 'tool_result', 'final']);

    replay.play();
    tick(REPLAY_TICK_MS);
    expect(replay.cursor()).toBe(0);
    tick(REPLAY_TICK_MS);
    expect(replay.cursor()).toBe(1);
    expect(replay.lastBatch().map((e) => e.kind)).toEqual(['step']);

    tick(2 * REPLAY_TICK_MS);
    expect(replay.cursor()).toBe(3);
    expect(replay.lastBatch().map((e) => (e.kind === 'tool_call' ? e.index : -1))).toEqual([1, 2]);
    replay.destroy();
  }));

  it('pauses on the spot and resumes from where it stopped', fakeAsync(() => {
    const replay = new TraceReplay(events, 450);
    replay.play();
    tick(3 * REPLAY_TICK_MS);
    replay.pause();
    expect(replay.playing()).toBeFalse();
    expect(replay.elapsedMs()).toBe(150);
    expect(replay.cursor()).toBe(1);

    tick(1000);
    expect(replay.elapsedMs()).toBe(150);
    expect(replay.cursor()).toBe(1);

    replay.play();
    tick(REPLAY_TICK_MS);
    expect(replay.elapsedMs()).toBe(200);
    expect(replay.cursor()).toBe(3);
    replay.destroy();
  }));

  it('steps one event at a time, moves the clock to it and holds there', fakeAsync(() => {
    const replay = new TraceReplay(events, 450);
    replay.play();
    tick(REPLAY_TICK_MS);
    replay.step();
    expect(replay.playing()).toBeFalse();
    expect(replay.cursor()).toBe(1);
    expect(replay.elapsedMs()).toBe(100);

    replay.step();
    expect(replay.cursor()).toBe(2);
    expect(replay.lastBatch().length).toBe(1);
    expect(replay.elapsedMs()).toBe(200);

    tick(1000);
    expect(replay.cursor()).toBe(2);

    for (let i = 0; i < 10; i++) replay.step();
    expect(replay.finished()).toBeTrue();
    expect(replay.elapsedMs()).toBe(450);
  }));

  it('scales the clock by the speed, including a change mid-play', fakeAsync(() => {
    const replay = new TraceReplay(events, 450);
    replay.setSpeed(4);
    replay.play();
    tick(REPLAY_TICK_MS);
    expect(replay.elapsedMs()).toBe(4 * REPLAY_TICK_MS);
    expect(replay.cursor()).toBe(3);

    replay.setSpeed(2);
    tick(REPLAY_TICK_MS);
    expect(replay.elapsedMs()).toBe(6 * REPLAY_TICK_MS);
    expect(replay.cursor()).toBe(5);
    replay.destroy();
  }));

  it('stops at the run total once the final event lands, and Play starts it over', fakeAsync(() => {
    const run = file.runs[0];
    const replay = new TraceReplay(run.events, run.totalMs);
    replay.play();
    tick(run.totalMs + REPLAY_TICK_MS);
    expect(replay.finished()).toBeTrue();
    expect(replay.playing()).toBeFalse();
    expect(replay.elapsedMs()).toBe(run.totalMs);
    const last = run.events[run.events.length - 1];
    expect(last.kind).toBe('final');
    expect(replayState(replay.events, replay.cursor()).final as TraceEvent | null).toBe(last);

    replay.play();
    expect(replay.cursor()).toBe(0);
    expect(replay.elapsedMs()).toBe(0);
    expect(replay.playing()).toBeTrue();
    replay.destroy();
  }));
});

// The counters must end on the numbers each recorded turn reported, not on a
// sum the page works out: tokens are cumulative, and r3's one tool call failed.
describe('replayState over the recorded runs', () => {
  it('ends every run on the steps, tool calls and tokens its done frame reports', () => {
    expect(file.runs.length).toBeGreaterThan(0);
    for (const run of file.runs) {
      const state = replayState(run.events, run.events.length);
      expect(state.step).withContext(run.id).toBe(run.done?.steps as number);
      expect(state.toolCalls).withContext(run.id).toBe(run.done?.toolCalls as number);
      expect(state.tokens).withContext(run.id).toBe(run.done?.tokens as number);
      expect(state.calls.every((c) => c.result !== null)).withContext(run.id).toBeTrue();
      expect(state.final).withContext(run.id).not.toBeNull();
      expect(state.modelBusy).withContext(run.id).toBeFalse();
    }
  });

  it('marks a tool result that came back with ok false as failed', () => {
    const run = file.runs.find((r) => r.events.some((e) => e.kind === 'tool_result' && !e.ok));
    expect(run).withContext('a recorded run with a failed tool call').toBeDefined();
    const state = replayState(run!.events, run!.events.length);
    expect(state.calls.some((c) => c.result?.ok === false)).toBeTrue();
  });

  it('narrates each event in one short line with the real tool name and server time', () => {
    const run = file.runs.find((r) => r.id === 'r3')!;
    const result = run.events.find((e) => e.kind === 'tool_result')!;
    expect(describeEvent(result)).toBe('Step 1: fx.get_rate_series, 1,488 ms, failed');
    expect(describeEvent(events[1])).toBe('Step 1: the loop asks the model what to do');
  });
});
