const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

function buildBody({ system, messages, maxTokens, temperature, model, stream }) {
  const body = {
    model: model || DEFAULT_MODEL,
    max_tokens: maxTokens,
    system,
    messages,
  };
  if (typeof temperature === 'number') body.temperature = temperature;
  if (stream) body.stream = true;
  return body;
}

function authHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };
}

async function callAnthropic(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('Anthropic API key not configured');
    err.code = 'NO_API_KEY';
    throw err;
  }
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Anthropic ${response.status}: ${text}`);
    err.code = 'UPSTREAM_ERROR';
    err.status = response.status;
    throw err;
  }
  return response;
}

async function callClaude({ system, messages, maxTokens = 1024, temperature, model }) {
  const response = await callAnthropic(buildBody({ system, messages, maxTokens, temperature, model }));
  const data = await response.json();
  return data.content?.[0]?.text || '';
}

// Streams Claude's response by piping content_block_delta text events into onText.
// Returns the full concatenated text once the stream completes.
async function streamClaude({ system, messages, maxTokens = 1024, temperature, model, onText }) {
  const response = await callAnthropic(buildBody({ system, messages, maxTokens, temperature, model, stream: true }));

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    // SSE frames are separated by \n\n; each frame may have multiple lines.
    const frames = buffer.split('\n\n');
    buffer = frames.pop() || '';

    for (const frame of frames) {
      for (const line of frame.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            const chunk = evt.delta.text || '';
            if (chunk) {
              full += chunk;
              onText?.(chunk);
            }
          }
        } catch {
          // Skip malformed frames silently; the stream often emits keepalives.
        }
      }
    }
  }

  return full;
}

module.exports = { callClaude, streamClaude };
