const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

async function callClaude({ system, messages, maxTokens = 1024, temperature }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('Anthropic API key not configured');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const body = {
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: maxTokens,
    system,
    messages,
  };
  if (typeof temperature === 'number') body.temperature = temperature;

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Anthropic ${response.status}: ${text}`);
    err.code = 'UPSTREAM_ERROR';
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

module.exports = { callClaude };
