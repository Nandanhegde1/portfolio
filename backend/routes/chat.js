const express = require('express');
const limiters = require('../lib/limiters');
const { callClaude } = require('../lib/anthropic');
const { getSupabase } = require('../supabase');
const SYSTEM_PROMPT = require('../prompts/chat-system');
const { languageInstruction } = require('../lib/i18n');

const router = express.Router();

router.post('/', limiters.chat, async (req, res) => {
  const { message, history, lang } = req.body || {};

  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  // Build context window: last 10 turns + current message, each capped at 1000 chars.
  const messages = [];
  if (Array.isArray(history)) {
    for (const msg of history.slice(-10)) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: String(msg.content).slice(0, 1000) });
      }
    }
  }
  messages.push({ role: 'user', content: message.slice(0, 1000) });

  try {
    const reply = await callClaude({ system: SYSTEM_PROMPT + languageInstruction(lang), messages, maxTokens: 1024 })
      || 'Sorry, I could not generate a response.';

    const sb = getSupabase();
    if (sb) {
      try {
        const { error } = await sb.from('chat_logs').insert({
          user_message: message.slice(0, 1000),
          ai_reply: reply.slice(0, 5000),
        });
        if (error) console.error('[supabase] chat_logs insert failed:', error.message);
      } catch (e) {
        console.error('[chat] log insert exception:', e.message);
      }
    }

    res.json({ reply });
  } catch (err) {
    if (err.code === 'NO_API_KEY') return res.status(503).json({ error: 'Chat service unavailable' });
    if (err.code === 'UPSTREAM_ERROR') {
      console.error('Anthropic API error:', err.message);
      return res.status(502).json({ error: 'AI service error' });
    }
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
