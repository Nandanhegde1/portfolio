const express = require('express');
const limiters = require('../lib/limiters');
const { getSupabase } = require('../supabase');

const router = express.Router();

// ── Constants ─────────────────────────────────────────────────────────
const MAX_BODY = 280;
const MAX_NAME = 60;
const MAX_LINK = 200;

// Lightweight profanity / slur filter. Catches the obvious; not a moderation system.
const BANNED = /\b(fuck|shit|bitch|cunt|nigger|faggot|retard)\b/i;

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

function clean(s, max) {
  return String(s || '').trim().slice(0, max);
}

function safeLink(link) {
  if (!link) return null;
  const trimmed = clean(link, MAX_LINK);
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

// ── GET /api/roasts ───────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);

  const { data, error } = await sb
    .from('roasts')
    .select('id, body, author_name, author_link, is_pinned, reply_body, reply_at, created_at')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[roasts] fetch failed:', error.message);
    return res.status(500).json({ error: 'Failed to fetch roasts' });
  }
  res.json(data || []);
});

// ── POST /api/roasts ──────────────────────────────────────────────────
router.post('/', limiters.comments, async (req, res) => {
  const body = clean(req.body?.body, MAX_BODY);
  const author_name = clean(req.body?.author_name, MAX_NAME) || null;
  const author_link = safeLink(req.body?.author_link);

  if (body.length < 4) {
    return res.status(400).json({ error: 'Roast is too short. Bring some heat.' });
  }
  if (BANNED.test(body)) {
    return res.status(400).json({ error: 'Keep it clever, not crude.' });
  }

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Roast wall is offline.' });

  const { data, error } = await sb
    .from('roasts')
    .insert({ body, author_name, author_link })
    .select('id, body, author_name, author_link, is_pinned, reply_body, reply_at, created_at')
    .single();

  if (error) {
    console.error('[roasts] insert failed:', error.message);
    return res.status(500).json({ error: 'Failed to save roast' });
  }
  res.json(data);
});

// ── Admin: reply / pin / delete (header secret) ───────────────────────
function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN || req.get('x-admin-token') !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

router.post('/:id/reply', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'unavailable' });
  const reply = clean(req.body?.reply_body, 500);
  if (!reply) return res.status(400).json({ error: 'reply_body required' });
  const { data, error } = await sb
    .from('roasts')
    .update({ reply_body: reply, reply_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:id/pin', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'unavailable' });
  const pinned = req.body?.is_pinned !== false;
  const { data, error } = await sb
    .from('roasts')
    .update({ is_pinned: pinned })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'unavailable' });
  const { error } = await sb.from('roasts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
