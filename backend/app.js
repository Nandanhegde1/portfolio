const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const limiters = require('./lib/limiters');

const app = express();

// Render/Heroku/etc. terminate TLS at a reverse proxy.
// Trust the first hop so req.ip + X-Forwarded-For work for rate-limit.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'],
    methods: ['GET', 'POST'],
  })
);
app.use(express.json({ limit: '10kb' }));

app.use((req, _res, next) => {
  // req.path, not req.url — query strings can carry sensitive values and
  // don't belong in logs.
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(limiters.global);

app.get('/', (_req, res) => {
  res.json({
    message: 'Portfolio API',
    endpoints: [
      '/api/health',
      '/api/roast',
      '/api/roasts',
      '/api/github/user/:username',
      '/api/github/repos/:username',
      '/api/analytics',
      '/api/contact',
      '/api/recruiter/stats',
      '/api/interviews/stats',
      '/api/spotify/now-playing',
    ],
  });
});

app.use('/api/health',     require('./routes/health'));
app.use('/api/github',     require('./routes/github'));
app.use('/api/analytics',  require('./routes/analytics'));
app.use('/api/roast',      require('./routes/roast'));
app.use('/api/roasts',     require('./routes/roasts'));
app.use('/api/contact',    require('./routes/contact'));
app.use('/api/blog',       require('./routes/blog'));
app.use('/api/recruiter',  require('./routes/recruiter'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/spotify',    require('./routes/spotify'));
app.use('/api/admin',      require('./routes/admin'));

// A JSON API should fail as JSON — not with Express's HTML error pages.
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Malformed JSON bodies land here (body-parser throws), as do sync route errors.
  const status = err?.type === 'entity.parse.failed' ? 400 : err?.status || 500;
  const message = status === 400 ? 'Invalid JSON body' : 'Internal server error';
  if (status >= 500) console.error('[error]', err?.message || err);
  if (res.headersSent) return;
  res.status(status).json({ error: message });
});

module.exports = app;
