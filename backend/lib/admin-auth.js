const crypto = require('node:crypto');

// Gate admin-only endpoints behind a shared secret in the x-admin-token header.
// Header (not ?key=) so the secret never lands in request logs; timingSafeEqual
// so the comparison doesn't leak length/prefix information.
// ADMIN_TOKEN is the canonical var; ADMIN_KEY is accepted as a legacy alias.
function requireAdminKey(req, res, next) {
  const secret = process.env.ADMIN_TOKEN || process.env.ADMIN_KEY || '';
  const supplied = req.get('x-admin-token') || '';
  if (!secret || !timingSafeMatch(supplied, secret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function timingSafeMatch(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

module.exports = { requireAdminKey, timingSafeMatch };
