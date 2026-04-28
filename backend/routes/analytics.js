const express = require('express');
const { getSupabase } = require('../supabase');

const router = express.Router();

router.post('/', async (req, res) => {
  const { path, referrer, userAgent } = req.body || {};
  const sb = getSupabase();

  if (sb) {
    try {
      const { error } = await sb.from('page_views').insert({
        path: (path || '/').toString().substring(0, 500),
        referrer: (referrer || '').toString().substring(0, 500),
        user_agent: (userAgent || req.get('user-agent') || '').toString().substring(0, 500),
        ip: req.ip,
      });
      if (error) console.error('[supabase] page_views insert failed:', error.message);
    } catch (e) {
      console.error('[analytics] insert exception:', e.message);
    }
  }

  res.json({ ok: true });
});

async function getStats(_req, res) {
  const sb = getSupabase();
  if (!sb) return res.json({ totalPageViews: 0, pages: {} });

  const { data: views } = await sb.from('page_views').select('path');
  const pages = {};
  (views || []).forEach((v) => {
    pages[v.path] = (pages[v.path] || 0) + 1;
  });

  res.json({
    totalPageViews: views?.length || 0,
    pages,
  });
}

router.get('/', getStats);
router.get('/stats', getStats);

module.exports = router;
