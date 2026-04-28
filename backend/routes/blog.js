const express = require('express');
const limiters = require('../lib/limiters');
const { getSupabase } = require('../supabase');

const router = express.Router();

const ALLOWED_REACTIONS = ['👍', '❤️', '🔥', '🤔', '🎯'];

// GET /api/blog/comments?slug=post-slug
router.get('/comments', async (req, res) => {
  const slug = String(req.query.slug || '').slice(0, 120);
  if (!slug) return res.status(400).json({ error: 'slug is required' });

  const sb = getSupabase();
  if (!sb) return res.json([]);

  const { data, error } = await sb
    .from('blog_comments')
    .select('id, post_slug, name, body, reactions, created_at')
    .eq('post_slug', slug)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: 'Failed to fetch comments' });
  res.json(data || []);
});

// POST /api/blog/comments  { slug, name, body }
router.post('/comments', limiters.comments, async (req, res) => {
  const { slug, name, body } = req.body || {};
  if (!slug || !name || !body) {
    return res.status(400).json({ error: 'slug, name and body are required' });
  }
  if (typeof slug !== 'string' || typeof name !== 'string' || typeof body !== 'string') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const cleanName = name.trim().slice(0, 60);
  const cleanBody = body.trim().slice(0, 800);
  const cleanSlug = slug.trim().slice(0, 120);
  if (cleanName.length < 2 || cleanBody.length < 2) {
    return res.status(400).json({ error: 'Name and message are too short' });
  }

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Comments unavailable' });

  const { data, error } = await sb
    .from('blog_comments')
    .insert({
      post_slug: cleanSlug,
      name: cleanName,
      body: cleanBody,
      reactions: {},
    })
    .select('id, post_slug, name, body, reactions, created_at')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to save comment' });
  res.json(data);
});

// POST /api/blog/comments/:id/react  { emoji }
router.post('/comments/:id/react', limiters.reactions, async (req, res) => {
  const { id } = req.params;
  const emoji = String(req.body?.emoji || '');
  if (!ALLOWED_REACTIONS.includes(emoji)) {
    return res.status(400).json({ error: 'Invalid reaction' });
  }

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Reactions unavailable' });

  const { data: row, error: fetchErr } = await sb
    .from('blog_comments')
    .select('reactions')
    .eq('id', id)
    .single();

  if (fetchErr || !row) return res.status(404).json({ error: 'Comment not found' });

  const reactions = { ...(row.reactions || {}) };
  reactions[emoji] = (reactions[emoji] || 0) + 1;

  const { data, error } = await sb
    .from('blog_comments')
    .update({ reactions })
    .eq('id', id)
    .select('id, reactions')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to react' });
  res.json(data);
});

module.exports = router;
