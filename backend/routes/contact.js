const express = require('express');
const limiters = require('../lib/limiters');
const { getSupabase } = require('../supabase');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', limiters.contact, async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Only report success once the message is stored. This used to answer "received"
  // with no database and after a failed insert, so the page showed a sent message
  // that had gone nowhere.
  const sb = getSupabase();
  if (!sb) {
    return res.status(503).json({ error: 'Contact inbox unavailable. Please email directly.' });
  }
  try {
    const { error } = await sb.from('contacts').insert({
      name: name.substring(0, 200),
      email: email.substring(0, 200),
      subject: subject.substring(0, 500),
      message: message.substring(0, 5000),
      ip: req.ip,
    });
    if (error) {
      console.error('[supabase] contacts insert failed:', error.message);
      return res.status(500).json({ error: 'Could not save your message. Please email directly.' });
    }
  } catch (e) {
    console.error('[contact] insert exception:', e.message);
    return res.status(500).json({ error: 'Could not save your message. Please email directly.' });
  }

  res.json({ success: true, message: 'Message received!' });
});

module.exports = router;
