import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AgentTraceServer, TraceFileEvent } from '../../core/models';
import { AgentTraceService } from '../../core/services/agent-trace.service';
import {
  REPLAY_SPEEDS,
  TraceReplay,
  describeEvent,
  formatNumber,
  replayState,
} from './trace-replay';

interface DiagramNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub: string;
}

interface DiagramEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Arrowhead polygon at the (x2, y2) end. */
  head: string;
}

interface DiagramLayout {
  w: number;
  h: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

interface Packet {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  back: boolean;
  failed: boolean;
}

type EdgeMode = 'on' | 'walking';
type NodeMode = 'on' | 'busy' | 'done' | 'failed';

/** Recorded time a packet takes to cross an edge. */
const PACKET_MS = 500;

/** Short chip titles for the recorded questions; any other run falls back to its question. */
const RUN_TITLES: Record<string, string> = {
  r1: 'Football in Koramangala',
  r2: 'Bangkok trip and baht',
  r3: 'Rupees to dirhams',
};

const recordedDateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const round = (n: number): number => Math.round(n * 10) / 10;

const seconds = (ms: number): string => (ms / 1000).toFixed(1);

const percent = (value: number, max: number): number => (max > 0 ? Math.min(100, (value / max) * 100) : 0);

interface Counter {
  label: string;
  text: string;
  /** Share of the ceiling used, or null when the recording has no ceiling for it. */
  pct: number | null;
}

function counter(label: string, value: number, max: number | undefined): Counter {
  return max
    ? { label, text: `${formatNumber(value)} / ${formatNumber(max)}`, pct: percent(value, max) }
    : { label, text: formatNumber(value), pct: null };
}

/** The point where the line from a's centre towards b leaves a's box, pushed out by gap. */
function borderPoint(a: DiagramNode, b: DiagramNode, gap: number): [number, number] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const sx = dx === 0 ? Infinity : a.w / 2 / Math.abs(dx);
  const sy = dy === 0 ? Infinity : a.h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy);
  return [a.x + dx * s + (dx / len) * gap, a.y + dy * s + (dy / len) * gap];
}

function edgeBetween(id: string, a: DiagramNode, b: DiagramNode): DiagramEdge {
  const [x1, y1] = borderPoint(a, b, 4);
  const [tx, ty] = borderPoint(b, a, 3);
  const len = Math.hypot(tx - x1, ty - y1) || 1;
  const ux = (tx - x1) / len;
  const uy = (ty - y1) / len;
  const bx = tx - ux * 9;
  const by = ty - uy * 9;
  const px = -uy * 4.5;
  const py = ux * 4.5;
  return {
    id,
    x1: round(x1),
    y1: round(y1),
    x2: round(bx),
    y2: round(by),
    head: [[tx, ty], [bx + px, by + py], [bx - px, by - py]].map(([x, y]) => `${round(x)},${round(y)}`).join(' '),
  };
}

/** Wide screens read left to right; narrow ones stack top to bottom. */
function buildLayout(narrow: boolean, servers: AgentTraceServer[], model: string | undefined): DiagramLayout {
  const toolTotal = servers.reduce((sum, s) => sum + s.tools.length, 0);
  const count = servers.length;
  const nodes: DiagramNode[] = [];
  let w: number;
  let h: number;
  if (narrow) {
    // Servers sit in a column to the right of the host, so each label gets the full box width.
    w = 320;
    h = 552;
    const nh = 46;
    nodes.push(
      { id: 'you', x: 160, y: 30, w: 128, h: nh, label: 'You', sub: 'the question' },
      { id: 'api', x: 160, y: 112, w: 140, h: nh, label: 'FastAPI', sub: 'SSE stream' },
      { id: 'loop', x: 84, y: 196, w: 140, h: nh, label: 'Agent loop', sub: 'one function' },
      { id: 'model', x: 236, y: 276, w: 150, h: nh, label: 'Model', sub: model ?? 'LLM' },
      { id: 'host', x: 66, y: 430, w: 108, h: nh, label: 'MCP host', sub: `${toolTotal} tools` },
    );
    servers.forEach((s, i) => {
      nodes.push({
        id: `srv:${s.id}`,
        x: 240,
        y: 430 + (i - (count - 1) / 2) * 76,
        w: 150,
        h: nh,
        label: s.label,
        sub: `${s.id} · ${s.tools.length} tools`,
      });
    });
  } else {
    w = 960;
    h = 360;
    const nh = 56;
    nodes.push(
      { id: 'you', x: 80, y: 150, w: 124, h: nh, label: 'You', sub: 'the question' },
      { id: 'api', x: 252, y: 150, w: 136, h: nh, label: 'FastAPI', sub: 'SSE stream' },
      { id: 'loop', x: 444, y: 150, w: 144, h: nh, label: 'Agent loop', sub: 'one function' },
      { id: 'model', x: 444, y: 296, w: 200, h: nh, label: 'Model', sub: model ?? 'LLM' },
      { id: 'host', x: 640, y: 150, w: 136, h: nh, label: 'MCP host', sub: `${toolTotal} tools` },
    );
    servers.forEach((s, i) => {
      nodes.push({
        id: `srv:${s.id}`,
        x: 862,
        y: 150 + (i - (count - 1) / 2) * 92,
        w: 164,
        h: nh,
        label: s.label,
        sub: `${s.id} · ${s.tools.length} tools`,
      });
    });
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const node = (id: string): DiagramNode => byId.get(id) as DiagramNode;
  const edges: DiagramEdge[] = [
    edgeBetween('you-api', node('you'), node('api')),
    edgeBetween('api-loop', node('api'), node('loop')),
    edgeBetween('loop-model', node('loop'), node('model')),
    edgeBetween('loop-host', node('loop'), node('host')),
    ...servers.map((s) => edgeBetween(`host-${s.id}`, node('host'), node(`srv:${s.id}`))),
  ];
  return { w, h, nodes, edges };
}

@Component({
  selector: 'app-lab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="lab">
      <div class="lab__container">
        <header class="lab__header">
          <span class="lab__eyebrow">// the lab · agent trace</span>
          <h1 class="lab__title">Watch an AI agent work</h1>
          <p class="lab__lede">
            Planning Desk answers planning questions by calling real tools over MCP. Its agent loop is one
            hand-written function, with no orchestration framework, over three MCP servers. Pick a question to
            see one turn: each model call, each tool call and how long it took, against the ceilings the loop enforces.
          </p>
          @if (data()) {
            <p class="lab__honesty" data-testid="honesty">
              A recorded run from the live Planning Desk app on {{ recordedDate() }}, replayed in your browser.
              No model is called from this page.
            </p>
          }
          <div class="lab__links">
            <a class="lab__link lab__link--primary" [href]="liveAppUrl" target="_blank" rel="noopener">Try the live app</a>
            <a class="lab__link" [href]="sourceUrl" target="_blank" rel="noopener">Source</a>
          </div>
        </header>

        @if (traces.error(); as message) {
          <p class="lab__status" role="alert">{{ message }}</p>
        } @else if (!data()) {
          <p class="lab__status">Loading the recorded runs...</p>
        }

        @if (data(); as d) {
          <div class="lab__picker" role="group" aria-label="Recorded questions">
            @for (r of d.runs; track r.id) {
              <button
                type="button"
                class="lab__chip"
                [class.lab__chip--active]="r.id === run()?.id"
                [attr.aria-pressed]="r.id === run()?.id"
                (click)="select(r.id)"
              >
                <span class="lab__chip-title">{{ runTitle(r.id, r.question) }}</span>
                @if (modeLabel(r.mode); as mode) {
                  <span class="lab__chip-meta">{{ mode }}</span>
                }
              </button>
            }
          </div>
        }

        @if (run(); as r) {
          <article class="lab__panel">
            <div class="lab__question">
              <span class="lab__label">You asked</span>
              <p class="lab__question-text">{{ r.question }}</p>
              <p class="lab__question-meta">
                @if (modeLabel(r.mode); as mode) {
                  <span>Mode: {{ mode }}</span>
                }
                @if (r.toolsOffered !== undefined) {
                  <span>{{ r.toolsOffered }} of {{ toolTotal() }} tools offered</span>
                }
                @if (data()?.model; as model) {
                  <span>Model: {{ model }}</span>
                }
              </p>
            </div>

            <div class="lab__controls">
              <button type="button" class="lab__btn lab__btn--primary" (click)="replay()?.toggle()">
                {{ replay()?.playing() ? 'Pause' : (replay()?.finished() ? 'Play again' : 'Play') }}
              </button>
              <!-- aria-disabled, not disabled: a disabled button drops keyboard focus to the page. -->
              <button
                type="button"
                class="lab__btn"
                (click)="replay()?.step()"
                [attr.aria-disabled]="replay()?.finished() ? 'true' : null"
              >Step</button>
              <button type="button" class="lab__btn" (click)="replay()?.replay()">Replay</button>
              <div class="lab__speeds" role="group" aria-label="Playback speed">
                @for (s of speeds; track s) {
                  <button
                    type="button"
                    class="lab__speed"
                    [class.lab__speed--active]="replay()?.speed() === s"
                    [attr.aria-pressed]="replay()?.speed() === s"
                    (click)="replay()?.setSpeed(s)"
                  >{{ s }}x</button>
                }
              </div>
            </div>

            <div class="lab__stage" [class.lab__stage--paused]="!replay()?.playing()">
              <svg
                class="lab__svg"
                [class.lab__svg--narrow]="narrow()"
                [attr.viewBox]="'0 0 ' + layout().w + ' ' + layout().h"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                [attr.aria-label]="diagramLabel()"
              >
                <g>
                  @for (e of layout().edges; track e.id) {
                    <g
                      class="lab__edge"
                      [class.lab__edge--on]="edgeModes()[e.id] === 'on'"
                      [class.lab__edge--walking]="edgeModes()[e.id] === 'walking'"
                    >
                      <line class="lab__edge-line" [attr.x1]="e.x1" [attr.y1]="e.y1" [attr.x2]="e.x2" [attr.y2]="e.y2" />
                      <polygon class="lab__edge-head" [attr.points]="e.head" />
                    </g>
                  }
                </g>
                @if (!reducedMotion()) {
                  <g>
                    @for (p of packets(); track p.id) {
                      <circle
                        class="lab__packet"
                        [class.lab__packet--back]="p.back"
                        [class.lab__packet--failed]="p.failed"
                        r="5"
                        [style.--x1]="p.x1 + 'px'"
                        [style.--y1]="p.y1 + 'px'"
                        [style.--x2]="p.x2 + 'px'"
                        [style.--y2]="p.y2 + 'px'"
                        [style.--dur]="packetDuration()"
                      />
                    }
                  </g>
                }
                <g>
                  @for (n of layout().nodes; track n.id) {
                    <g class="lab__node" [attr.data-state]="nodeModes()[n.id] ?? 'idle'" [attr.transform]="'translate(' + n.x + ' ' + n.y + ')'">
                      <rect class="lab__node-box" [attr.x]="-n.w / 2" [attr.y]="-n.h / 2" [attr.width]="n.w" [attr.height]="n.h" rx="10" />
                      <text class="lab__node-label" text-anchor="middle" y="-3">{{ n.label }}</text>
                      <text class="lab__node-sub" text-anchor="middle" y="13">{{ n.sub }}</text>
                      @if (nodeNotes()[n.id]; as note) {
                        <text class="lab__node-note" text-anchor="middle" [attr.y]="n.h / 2 + 16">{{ note }}</text>
                      }
                    </g>
                  }
                </g>
              </svg>
            </div>

            <p class="lab__narration" aria-live="polite" aria-atomic="true">
              @for (line of narration(); track $index) {
                <span class="lab__narration-line">{{ line }}</span>
              } @empty {
                <span class="lab__narration-line lab__narration-line--idle">Press Play to replay the turn, or Step to go one event at a time.</span>
              }
            </p>

            <dl class="lab__counters">
              @for (c of counters(); track c.label) {
                <div class="lab__counter">
                  <dt>{{ c.label }}</dt>
                  <dd>
                    <span class="lab__counter-value">{{ c.text }}</span>
                    @if (c.pct !== null) {
                      <span class="lab__bar" aria-hidden="true"><span [style.width.%]="c.pct"></span></span>
                    }
                  </dd>
                </div>
              }
            </dl>

            <section class="lab__section" aria-labelledby="lab-timings">
              <h2 class="lab__h2" id="lab-timings">Tool calls</h2>
              @if (state().calls.length) {
                <ol class="lab__timings">
                  @for (c of state().calls; track c.call.index) {
                    <li class="lab__timing" [attr.data-state]="c.result ? (c.result.ok ? 'done' : 'failed') : 'busy'">
                      <div class="lab__timing-head">
                        <span class="lab__timing-tool">{{ c.call.tool }}</span>
                        <span class="lab__timing-server">{{ serverLabel(c.call.server) }}</span>
                        <span class="lab__timing-ms">
                          @if (c.result; as res) {
                            {{ fmt(res.durationMs) }} ms{{ res.ok ? '' : ', failed' }}
                          } @else {
                            running
                          }
                        </span>
                      </div>
                      @if (c.result; as res) {
                        <span class="lab__bar lab__bar--timing" aria-hidden="true"><span [style.width.%]="percent(res.durationMs, slowestTool())"></span></span>
                        @if (res.summary) {
                          <p class="lab__timing-summary">{{ res.summary }}</p>
                        }
                      }
                    </li>
                  }
                </ol>
              } @else {
                <p class="lab__muted">No tool calls yet. They appear here as the replay reaches them.</p>
              }
            </section>

            <section class="lab__section" aria-labelledby="lab-answer">
              <h2 class="lab__h2" id="lab-answer">Answer</h2>
              @if (state().final; as fin) {
                <blockquote class="lab__answer">{{ fin.text }}</blockquote>
                @for (f of state().files; track $index) {
                  <p class="lab__muted">{{ fileLine(f) }}</p>
                }
                <p class="lab__muted">{{ doneLine() }}</p>
              } @else {
                <p class="lab__muted">The answer appears when the replay reaches it.</p>
              }
            </section>

            <p class="lab__footnote">
              Clock times are when each event reached the recording client. Tool times are measured on the server,
              and tool calls in the same step run side by side.
              @if (ceilings()?.turnSeconds) {
                The step, tool call and token ceilings were read from the live app; the {{ ceilings()?.turnSeconds }} s
                turn budget is the app's default setting, which the live app does not report.
              }
            </p>
          </article>
        }
      </div>
    </section>
  `,
  styleUrl: './lab.component.scss',
})
export class LabComponent implements OnInit, OnDestroy {
  protected readonly traces = inject(AgentTraceService);

  protected readonly liveAppUrl = 'https://planning-desk.onrender.com';
  protected readonly sourceUrl = 'https://github.com/Nandanhegde1/planning-desk';
  protected readonly speeds = REPLAY_SPEEDS;

  protected readonly narrow = signal(false);
  protected readonly reducedMotion = signal(false);
  private readonly selectedId = signal<string | null>(null);
  private readonly mediaCleanup: (() => void)[] = [];

  protected readonly data = this.traces.data;

  protected readonly run = computed(() => {
    const d = this.data();
    if (!d || !d.runs.length) return null;
    return d.runs.find((r) => r.id === this.selectedId()) ?? d.runs[0];
  });

  /** One replay per selected run; select() stops the old one before switching. */
  protected readonly replay = computed(() => {
    const r = this.run();
    return r ? new TraceReplay(r.events, r.totalMs) : null;
  });

  protected readonly state = computed(() => {
    const rp = this.replay();
    return replayState(rp ? rp.events : [], rp ? rp.cursor() : 0);
  });

  protected readonly ceilings = computed(() => this.data()?.ceilings ?? null);

  protected readonly recordedDate = computed(() => {
    const at = this.data()?.recordedAt;
    return at ? recordedDateFormat.format(new Date(at)) : '';
  });

  protected readonly toolTotal = computed(() =>
    (this.data()?.servers ?? []).reduce((sum, s) => sum + s.tools.length, 0),
  );

  protected readonly counters = computed(() => {
    const s = this.state();
    const c = this.ceilings();
    const elapsed = this.replay()?.elapsedMs() ?? 0;
    const list = [
      counter('Steps', s.step, c?.steps),
      counter('Tool calls', s.toolCalls, c?.toolCalls),
    ];
    if (this.hasTokens()) list.push(counter('Tokens', s.tokens ?? 0, c?.tokens));
    const turn = c?.turnSeconds;
    list.push({
      label: 'Elapsed',
      text: `${seconds(elapsed)} s${turn ? ` / ${turn} s` : ''}`,
      pct: turn ? percent(elapsed / 1000, turn) : null,
    });
    return list;
  });

  /** How the recorded turn ended, from its done frame. */
  protected readonly doneLine = computed(() => {
    const r = this.run();
    if (!r) return '';
    const done = r.done ?? {};
    const parts = [done.reason ?? 'done'];
    if (done.steps != null) parts.push(`${done.steps} ${done.steps === 1 ? 'step' : 'steps'}`);
    if (done.toolCalls != null) parts.push(`${done.toolCalls} tool ${done.toolCalls === 1 ? 'call' : 'calls'}`);
    if (done.tokens != null) parts.push(`${formatNumber(done.tokens)} tokens`);
    parts.push(`${seconds(r.totalMs)} s`);
    return `Turn ended: ${parts.join(', ')}.`;
  });

  protected readonly hasTokens = computed(() => (this.run()?.events ?? []).some((e) => e.kind === 'tokens'));

  protected readonly slowestTool = computed(() =>
    Math.max(1, ...(this.run()?.events ?? []).map((e) => (e.kind === 'tool_result' ? e.durationMs : 0))),
  );

  protected readonly layout = computed(() =>
    buildLayout(this.narrow(), this.data()?.servers ?? [], this.data()?.model),
  );

  protected readonly diagramLabel = computed(() => {
    const servers = (this.data()?.servers ?? []).map((s) => s.label).join(', ');
    return `Diagram of one turn: you, FastAPI, the agent loop, the model, the MCP host and the MCP servers ${servers}. The line below the diagram describes each event as it happens.`;
  });

  protected readonly packetDuration = computed(() => `${PACKET_MS / (this.replay()?.speed() ?? 1)}ms`);

  protected readonly narration = computed(() => (this.replay()?.lastBatch() ?? []).map(describeEvent));

  protected readonly edgeModes = computed<Partial<Record<string, EdgeMode>>>(() => {
    const rp = this.replay();
    const modes: Partial<Record<string, EdgeMode>> = {};
    if (!rp) return modes;
    const s = this.state();
    if (rp.cursor() === 0) {
      if (rp.elapsedMs() > 0) modes['you-api'] = 'walking';
      return modes;
    }
    modes['you-api'] = 'on';
    modes['api-loop'] = 'on';
    if (s.final) return modes;
    if (s.modelBusy) modes['loop-model'] = 'walking';
    const busy = s.calls.filter((c) => !c.result);
    if (busy.length) {
      modes['loop-host'] = 'walking';
      for (const c of busy) modes[`host-${c.call.server}`] = 'walking';
    }
    return modes;
  });

  protected readonly nodeModes = computed<Partial<Record<string, NodeMode>>>(() => {
    const rp = this.replay();
    const modes: Partial<Record<string, NodeMode>> = {};
    if (!rp) return modes;
    const s = this.state();
    const started = rp.cursor() > 0 || rp.elapsedMs() > 0;
    if (!started) return modes;
    modes['you'] = 'on';
    modes['api'] = 'on';
    if (rp.cursor() > 0 && !s.final) modes['loop'] = 'on';
    if (s.modelBusy) modes['model'] = 'busy';
    for (const c of s.calls) {
      const id = `srv:${c.call.server}`;
      if (!c.result) {
        modes[id] = 'busy';
        modes['host'] = 'busy';
      } else if (modes[id] !== 'busy') {
        modes[id] = c.result.ok ? 'done' : 'failed';
      }
    }
    return modes;
  });

  /** Small text under a node: the latest model latency, or the server's latest tool time. */
  protected readonly nodeNotes = computed<Partial<Record<string, string>>>(() => {
    const s = this.state();
    const notes: Partial<Record<string, string>> = {};
    if (s.modelBusy) notes['model'] = 'thinking';
    else if (s.lastModelMs != null) notes['model'] = `${formatNumber(s.lastModelMs)} ms`;
    for (const c of s.calls) {
      const id = `srv:${c.call.server}`;
      notes[id] = c.result
        ? `${formatNumber(c.result.durationMs)} ms${c.result.ok ? '' : ', failed'}`
        : 'running';
    }
    return notes;
  });

  protected readonly packets = computed<Packet[]>(() => {
    const rp = this.replay();
    if (!rp) return [];
    const s = this.state();
    const t = rp.elapsedMs();
    const edges = new Map(this.layout().edges.map((e) => [e.id, e]));
    const list: Packet[] = [];
    const add = (id: string, edgeId: string, back: boolean, failed = false): void => {
      const e = edges.get(edgeId);
      if (!e) return;
      list.push(
        back
          ? { id, x1: e.x2, y1: e.y2, x2: e.x1, y2: e.y1, back, failed }
          : { id, x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, back, failed },
      );
    };
    if (rp.cursor() === 0) {
      if (t > 0) add('request', 'you-api', false);
      return list;
    }
    if (s.modelBusy) add(`model-out-${s.step}`, 'loop-model', false);
    if (s.lastModelAt != null && t < s.lastModelAt + PACKET_MS) add(`model-back-${s.lastModelAt}`, 'loop-model', true);
    for (const c of s.calls) {
      const edge = `host-${c.call.server}`;
      if (!c.result) add(`call-${c.call.index}`, edge, false);
      else if (t < c.result.tMs + PACKET_MS) add(`result-${c.call.index}`, edge, true, !c.result.ok);
    }
    if (s.final) add('answer', 'you-api', true);
    return list;
  });

  ngOnInit(): void {
    this.traces.loadData();
    this.watchMedia('(max-width: 640px)', this.narrow);
    this.watchMedia('(prefers-reduced-motion: reduce)', this.reducedMotion);
  }

  ngOnDestroy(): void {
    this.replay()?.destroy();
    this.mediaCleanup.forEach((stop) => stop());
  }

  /** Switches to a run and plays it; picking the current run plays it from the start. */
  select(id: string): void {
    const current = this.replay();
    if (this.run()?.id === id) {
      current?.replay();
      return;
    }
    current?.destroy();
    this.selectedId.set(id);
    this.replay()?.play();
  }

  protected runTitle(id: string, question: string): string {
    return RUN_TITLES[id] ?? (question.length > 40 ? `${question.slice(0, 40).trimEnd()}...` : question);
  }

  protected modeLabel(mode: string | undefined): string | null {
    return mode ? this.data()?.modes?.[mode]?.label ?? null : null;
  }

  protected serverLabel(id: string): string {
    return this.data()?.servers.find((s) => s.id === id)?.label ?? id;
  }

  protected percent(value: number, max: number): number {
    return percent(value, max);
  }

  protected fmt(n: number): string {
    return formatNumber(n);
  }

  protected fileLine(f: TraceFileEvent): string {
    const what = f.fileKind === 'image' ? 'an image' : 'a file';
    return `The run also produced ${what}${f.filename ? ` (${f.filename})` : ''}. It is not kept here.`;
  }

  private watchMedia(query: string, target: WritableSignal<boolean>): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    target.set(mq.matches);
    const onChange = (e: MediaQueryListEvent): void => target.set(e.matches);
    mq.addEventListener('change', onChange);
    this.mediaCleanup.push(() => mq.removeEventListener('change', onChange));
  }
}
