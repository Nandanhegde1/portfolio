// Gemini through its OpenAI-compatible endpoint, which takes the chat-completions
// body and streams chat.completion.chunk frames over SSE, ending with [DONE].
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

function buildBody({ system, messages, maxTokens, temperature, model, stream }) {
  const body = {
    model: model || process.env.GEMINI_MODEL || DEFAULT_MODEL,
    max_tokens: maxTokens,
    messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
  };
  if (typeof temperature === 'number') body.temperature = temperature;
  if (stream) body.stream = true;
  return body;
}

async function callGeminiApi(body, signal) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('Gemini API key not configured');
    err.code = 'NO_API_KEY';
    throw err;
  }
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Gemini ${response.status}: ${text.slice(0, 300)}`);
    err.code = 'UPSTREAM_ERROR';
    err.status = response.status;
    throw err;
  }
  return response;
}

// Hands the text of every complete frame in the buffer to onDelta, and returns
// what is left: the start of a frame still arriving. A frame boundary can fall
// anywhere in a network chunk, so nothing is parsed until its blank line arrives.
function parseFrames(buffer, onDelta) {
  const frames = buffer.split('\n\n');
  const rest = frames.pop() || '';
  for (const frame of frames) {
    for (const line of frame.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const chunk = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (chunk) onDelta(chunk);
      } catch {
        // A keep-alive or a malformed frame; the next one carries on.
      }
    }
  }
  return rest;
}

async function callGemini({ system, messages, maxTokens = 1024, temperature, model, signal }) {
  const response = await callGeminiApi(buildBody({ system, messages, maxTokens, temperature, model }), signal);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Streams Gemini's reply into onText and returns the whole text once it ends.
async function streamGemini({ system, messages, maxTokens = 1024, temperature, model, onText, signal }) {
  const response = await callGeminiApi(
    buildBody({ system, messages, maxTokens, temperature, model, stream: true }),
    signal
  );

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  const onDelta = (chunk) => {
    full += chunk;
    onText?.(chunk);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer = parseFrames(buffer + decoder.decode(value, { stream: true }), onDelta);
  }
  // A last frame without its trailing blank line still counts.
  parseFrames(buffer + decoder.decode() + '\n\n', onDelta);

  return full;
}

module.exports = { callGemini, streamGemini, parseFrames, buildBody };
