const express = require('express');
const { getSupabase } = require('../supabase');
const { requireAdminKey } = require('../lib/admin-auth');

const router = express.Router();

const EMPTY_STATS = { total: 0, last30Days: 0, byCompany: {}, recent: [] };
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

router.get('/stats', async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json(EMPTY_STATS);

  try {
    const { data, error } = await sb
      .from('recruiter_logs')
      .select('company, role, source, contacted_at')
      .order('contacted_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('[supabase] recruiter_logs read failed:', error.message);
      return res.json(EMPTY_STATS);
    }

    const rows = data || [];
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    const byCompany = {};
    let last30Days = 0;

    rows.forEach((r) => {
      const company = r.company || 'Unknown';
      byCompany[company] = (byCompany[company] || 0) + 1;
      if (new Date(r.contacted_at).getTime() >= cutoff) last30Days += 1;
    });

    res.json({
      total: rows.length,
      last30Days,
      byCompany,
      recent: rows.slice(0, 10),
    });
  } catch (e) {
    console.error('[recruiter/stats] error:', e.message);
    res.json(EMPTY_STATS);
  }
});

router.post('/log', requireAdminKey, async (req, res) => {
  const { company, role, source, contacted_at, notes } = req.body || {};
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'DB unavailable' });

  const { data, error } = await sb
    .from('recruiter_logs')
    .insert({
      company: (company || 'Unknown').substring(0, 200),
      role: (role || '').substring(0, 200),
      source: (source || '').substring(0, 100),
      contacted_at: contacted_at || new Date().toISOString(),
      notes: (notes || '').substring(0, 1000),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
