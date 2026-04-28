const express = require('express');
const limiters = require('../lib/limiters');
const { getSupabase } = require('../supabase');

const router = express.Router();

router.get('/', async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);

  const { data, error } = await sb
    .from('guestbook')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: 'Failed to fetch guestbook' });
  res.json(data || []);
});

router.post('/', limiters.guestbook, async (req, res) => {
  const { name, message, emoji } = req.body || {};
  if (!name || !message || typeof name !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Guestbook unavailable' });

  const { data, error } = await sb
    .from('guestbook')
    .insert({
      name: name.substring(0, 100),
      message: message.substring(0, 1000),
      emoji: (emoji || '👍').substring(0, 10),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to save entry' });
  res.json(data);
});

module.exports = router;
