// Gate admin-only endpoints behind a shared secret in ?key=...
function requireAdminKey(req, res, next) {
  if (!process.env.ADMIN_KEY || req.query.key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { requireAdminKey };
