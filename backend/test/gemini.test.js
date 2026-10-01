// The Gemini client and the provider switch. No network: fetch is replaced, and
// the stream is a real Gemini response recorded to test/fixtures/gemini-stream.sse.
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const gemini = require('../lib/gemini');
const llm = require('../lib/llm');

const FIXTURE = fs.readFileSync(path.join(__dirname, 'fixtures', 'gemini-stream.sse'), 'utf8');
const realFetch = global.fetch;
const savedEnv = { ...process.env };

afterEach(() => {
  global.fetch = realFetch;
  process.env = { ...savedEnv };
});

function textOf(raw) {
  let text = '';
  gemini.parseFrames(raw + '\n\n', (chunk) => { text += chunk; });
  return text;
}

// A response whose body arrives in pieces of the given size, the way the network
// delivers it: frame boundaries land mid-chunk.
function streamedResponse(raw, size) {
  const bytes = new TextEncoder().encode(raw);
  const body = new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += size) controller.enqueue(bytes.slice(i, i + size));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

test('the recorded stream parses to the roast text, ignoring [DONE]', () => {
  const text = textOf(FIXTURE);
  assert.ok(text.startsWith('You'), text);
  assert.ok(text.length > 40);
  assert.ok(!text.includes('[DONE]'));
});

test('a frame split across network chunks still parses', async () => {
  const whole = textOf(FIXTURE);
  for (const size of [1, 7, 64]) {
    process.env.GEMINI_API_KEY = 'test-key';
    global.fetch = async () => streamedResponse(FIXTURE, size);
    const deltas = [];
    const full = await gemini.streamGemini({
      system: 's', messages: [{ role: 'user', content: 'u' }], onText: (c) => deltas.push(c),
    });
    assert.equal(full, whole, `chunk size ${size}`);
    assert.equal(deltas.join(''), whole);
  }
});

test('the request is chat-completions shaped, with the system prompt first', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  let sent;
  global.fetch = async (url, init) => {
    sent = { url, init, body: JSON.parse(init.body) };
    return streamedResponse(FIXTURE, 64);
  };
  const signal = new AbortController().signal;
  await gemini.streamGemini({
    system: 'roast it', messages: [{ role: 'user', content: 'Angular' }], maxTokens: 600, temperature: 1, signal,
  });
  assert.match(sent.url, /generativelanguage\.googleapis\.com\/v1beta\/openai\/chat\/completions$/);
  assert.equal(sent.init.headers.Authorization, 'Bearer test-key');
  assert.equal(sent.init.signal, signal, 'the abort signal must reach fetch');
  assert.deepEqual(sent.body.messages[0], { role: 'system', content: 'roast it' });
  assert.equal(sent.body.stream, true);
  assert.equal(sent.body.max_tokens, 600);
  assert.equal(sent.body.model, 'gemini-3.5-flash-lite');
});

test('a missing key is NO_API_KEY, so the route answers "unavailable"', async () => {
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(gemini.callGemini({ messages: [] }), { code: 'NO_API_KEY' });
});

test('an upstream refusal is UPSTREAM_ERROR and keeps its status', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  global.fetch = async () => new Response('[{"error":{"code":429}}]', { status: 429 });
  await assert.rejects(gemini.callGemini({ messages: [] }), { code: 'UPSTREAM_ERROR', status: 429 });
});

test('the provider is Gemini when its key is set, and can be forced', () => {
  delete process.env.LLM_PROVIDER;
  delete process.env.GEMINI_API_KEY;
  assert.equal(llm.provider(), 'anthropic');
  process.env.GEMINI_API_KEY = 'test-key';
  assert.equal(llm.provider(), 'gemini');
  process.env.LLM_PROVIDER = 'anthropic';
  assert.equal(llm.provider(), 'anthropic');
});
