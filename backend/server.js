const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const limiters = require('./lib/limiters');

const app = express();
const PORT = process.env.PORT || 3000;

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
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(limiters.global);

app.get('/', (_req, res) => {
  res.json({
    message: 'Portfolio API',
    endpoints: [
      '/api/health',
      '/api/chat',
      '/api/roast',
      '/api/github/user/:username',
      '/api/github/repos/:username',
      '/api/analytics',
      '/api/contact',
      '/api/guestbook',
      '/api/recruiter/stats',
      '/api/interviews/stats',
      '/api/spotify/now-playing',
    ],
  });
});

app.use('/api/health',     require('./routes/health'));
app.use('/api/github',     require('./routes/github'));
app.use('/api/analytics',  require('./routes/analytics'));
app.use('/api/chat',       require('./routes/chat'));
app.use('/api/roast',      require('./routes/roast'));
app.use('/api/contact',    require('./routes/contact'));
app.use('/api/guestbook',  require('./routes/guestbook'));
app.use('/api/recruiter',  require('./routes/recruiter'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/spotify',    require('./routes/spotify'));
app.use('/api/admin',      require('./routes/admin'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio API running on port ${PORT}`);
});
