const express = require('express');
const limiters = require('../lib/limiters');
const { callClaude } = require('../lib/anthropic');
const { getSupabase } = require('../supabase');
const { ROAST_PROMPTS } = require('../prompts/roast');

const router = express.Router();

const VALID_LEVELS = ['mild', 'medium', 'savage'];

router.post('/', limiters.roast, async (req, res) => {
  const { stack, intensity } = req.body || {};

  if (!stack || typeof stack !== 'string' || stack.length > 500) {
    return res.status(400).json({ error: 'Invalid stack. Keep it under 500 characters.' });
  }

  const level = VALID_LEVELS.includes(intensity) ? intensity : 'medium';

  try {
    const roast = await callClaude({
      system: ROAST_PROMPTS[level],
      messages: [{
        role: 'user',
        content: `Roast this tech stack (${level} intensity, go ALL IN): ${stack.slice(0, 500)}`,
      }],
      maxTokens: 1500,
      temperature: 1,
    }) || 'Your stack is so mid, even AI refuses to roast it.';

    const sb = getSupabase();
    if (sb) {
      try {
        const { error } = await sb.from('roast_logs').insert({
          stack: stack.slice(0, 500),
          intensity: level,
          roast: roast.slice(0, 5000),
        });
        if (error) console.error('[supabase] roast_logs insert failed:', error.message);
      } catch (e) {
        console.error('[roast] log insert exception:', e.message);
      }
    }

    res.json({ roast });
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
