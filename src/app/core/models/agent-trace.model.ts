// Shape of assets/data/agent-traces.json: real turns recorded from the live
// Planning Desk app's SSE stream and replayed on /lab. Optional fields are ones
// a recording may lack; the page shows only what a run carries.

export interface AgentTraceCeilings {
  steps?: number;
  toolCalls?: number;
  tokens?: number;
  turnSeconds?: number;
  toolTimeoutSeconds?: number;
  finalAnswerReserveSeconds?: number;
  note?: string;
}

export interface AgentTraceMode {
  label: string;
  tools: number;
}

export interface AgentTraceServer {
  id: string;
  label: string;
  tools: string[];
}

interface TraceEventBase {
  /** Arrival time at the client, in ms after the request was sent. */
  tMs: number;
  step: number;
}

/** A loop step starts: the agent asks the model what to do next. */
export interface TraceStepEvent extends TraceEventBase {
  kind: 'step';
  text?: string;
}

/** The model call for a step returned. `tokens` is cumulative for the turn. */
export interface TraceTokensEvent extends TraceEventBase {
  kind: 'tokens';
  tokens: number;
  modelMs?: number;
}

export interface TraceToolCallEvent extends TraceEventBase {
  kind: 'tool_call';
  /** Turn-wide tool call counter. */
  index: number;
  server: string;
  tool: string;
  args?: string;
}

export interface TraceToolResultEvent extends TraceEventBase {
  kind: 'tool_result';
  index: number;
  server: string;
  tool: string;
  /** Server-measured tool time; tMs only says when the step's results arrived. */
  durationMs: number;
  ok: boolean;
  bytes?: number;
  summary?: string;
}

export interface TraceFileEvent extends TraceEventBase {
  kind: 'file';
  fileKind?: string;
  filename?: string;
}

export interface TraceFinalEvent extends TraceEventBase {
  kind: 'final';
  text: string;
}

export type TraceEvent =
  | TraceStepEvent
  | TraceTokensEvent
  | TraceToolCallEvent
  | TraceToolResultEvent
  | TraceFileEvent
  | TraceFinalEvent;

export interface AgentTraceDone {
  reason?: string;
  steps?: number;
  tokens?: number;
  toolCalls?: number;
  doneMs?: number;
}

export interface AgentTraceRun {
  id: string;
  mode?: string;
  toolsOffered?: number;
  question: string;
  totalMs: number;
  firstByteMs?: number;
  done?: AgentTraceDone;
  toolsUsed?: string[];
  events: TraceEvent[];
}

export interface AgentTraceFile {
  recordedAt: string;
  source?: string;
  endpoint?: string;
  model?: string;
  provider?: string;
  ceilings?: AgentTraceCeilings;
  modes?: Record<string, AgentTraceMode>;
  servers: AgentTraceServer[];
  runs: AgentTraceRun[];
}
