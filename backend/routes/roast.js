const express = require('express');
const limiters = require('../lib/limiters');
const { callClaude, streamClaude } = require('../lib/anthropic');
const { getSupabase } = require('../supabase');
const { ROAST_PROMPTS } = require('../prompts/roast');
const { languageInstruction } = require('../lib/i18n');

const router = express.Router();

const VALID_LEVELS = ['mild', 'medium', 'savage'];
const FALLBACK = 'Your stack is so mid, even AI refuses to roast it.';
const MAX_TOKENS = 600;

function buildMessages(stack, level) {
  return [{
    role: 'user',
    content: `Roast this tech stack (${level} intensity, go ALL IN): ${stack.slice(0, 500)}`,
  }];
}

function logRoast({ stack, level, roast }) {
  const sb = getSupabase();
  if (!sb) return;
  sb.from('roast_logs')
    .insert({ stack: stack.slice(0, 500), intensity: level, roast: roast.slice(0, 5000) })
    .then(({ error }) => {
      if (error) console.error('[supabase] roast_logs insert failed:', error.message);
    });
}

function validate(req, res) {
  const { stack, intensity, lang } = req.body || {};
  if (!stack || typeof stack !== 'string' || stack.length > 500) {
    res.status(400).json({ error: 'Invalid stack. Keep it under 500 characters.' });
    return null;
  }
  const level = VALID_LEVELS.includes(intensity) ? intensity : 'medium';
  return { stack, level, lang };
}

// Streaming endpoint — perceived latency drops from ~10s to ~1s by
// flushing tokens as Anthropic generates them.
router.post('/stream', limiters.roast, limiters.llmDailyBudget, async (req, res) => {
  const params = validate(req, res);
  if (!params) return;
  const { stack, level, lang } = params;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let aborted = false;
  req.on('close', () => { aborted = true; });

  try {
    let full = '';
    await streamClaude({
      system: ROAST_PROMPTS[level] + languageInstruction(lang),
      messages: buildMessages(stack, level),
      maxTokens: MAX_TOKENS,
      temperature: 1,
      onText: (chunk) => {
        if (aborted) return;
        full += chunk;
        send('chunk', { text: chunk });
      },
    });

    if (aborted) return;
    const final = full || FALLBACK;
    send('done', { roast: final });
    res.end();
    logRoast({ stack, level, roast: final });
  } catch (err) {
    if (aborted) return;
    if (err.code === 'NO_API_KEY')   send('error', { error: 'Roast service unavailable' });
    else if (err.code === 'UPSTREAM_ERROR') {
      console.error('Roast API error:', err.message);
      send('error', { error: 'Roast service error' });
    } else {
      console.error('Roast error:', err.message);
      send('error', { error: 'Internal server error' });
    }
    res.end();
  }
});

// Legacy non-streaming endpoint — kept for clients that can't consume SSE.
router.post('/', limiters.roast, limiters.llmDailyBudget, async (req, res) => {
  const params = validate(req, res);
  if (!params) return;
  const { stack, level, lang } = params;

  try {
    const roast = await callClaude({
      system: ROAST_PROMPTS[level] + languageInstruction(lang),
      messages: buildMessages(stack, level),
      maxTokens: MAX_TOKENS,
      temperature: 1,
    }) || FALLBACK;

    res.json({ roast });
    logRoast({ stack, level, roast });
  } catch (err) {
    if (err.code === 'NO_API_KEY') return res.status(503).json({ error: 'Roast service unavailable' });
    if (err.code === 'UPSTREAM_ERROR') {
      console.error('Roast API error:', err.message);
      return res.status(502).json({ error: 'Roast service error' });
    }
    console.error('Roast error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
