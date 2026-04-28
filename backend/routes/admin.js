const express = require('express');
const { getSupabase } = require('../supabase');
const { requireAdminKey } = require('../lib/admin-auth');

const router = express.Router();

router.use(requireAdminKey);

const dump = (table, limit) => async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);
  const query = sb.from(table).select('*').order('created_at', { ascending: false });
  const { data } = limit ? await query.limit(limit) : await query;
  res.json(data || []);
};

router.get('/contacts',   dump('contacts'));
router.get('/chat-logs',  dump('chat_logs', 200));
router.get('/roast-logs', dump('roast_logs', 200));

module.exports = router;
