const express = require('express');
const { getSupabase } = require('../supabase');
const { requireAdminKey } = require('../lib/admin-auth');

const router = express.Router();

const EMPTY_STATS = { total: 0, byStage: {}, byOutcome: {}, recent: [] };

router.get('/stats', async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json(EMPTY_STATS);

  try {
    const { data, error } = await sb
      .from('interviews')
      .select('company, role, stage, outcome, interview_date')
      .order('interview_date', { ascending: false })
      .limit(200);

    if (error) {
      console.error('[supabase] interviews read failed:', error.message);
      return res.json(EMPTY_STATS);
    }

    const rows = data || [];
    const byStage = {};
    const byOutcome = {};

    rows.forEach((r) => {
      if (r.stage)   byStage[r.stage]     = (byStage[r.stage]   || 0) + 1;
      if (r.outcome) byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1;
    });

    res.json({
      total: rows.length,
      byStage,
      byOutcome,
      recent: rows.slice(0, 10),
    });
  } catch (e) {
    console.error('[interviews/stats] error:', e.message);
    res.json(EMPTY_STATS);
  }
});

router.post('/log', requireAdminKey, async (req, res) => {
  const { company, role, stage, outcome, interview_date, notes } = req.body || {};
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'DB unavailable' });

  const { data, error } = await sb
    .from('interviews')
    .insert({
      company: (company || 'Unknown').substring(0, 200),
      role: (role || '').substring(0, 200),
      stage: (stage || 'Applied').substring(0, 50),
      outcome: (outcome || 'Pending').substring(0, 50),
      interview_date: interview_date || new Date().toISOString(),
      notes: (notes || '').substring(0, 1000),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
