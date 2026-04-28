const express = require('express');

const router = express.Router();

const GITHUB_HEADERS = {
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'portfolio-app',
};

async function proxy(url, res) {
  try {
    const upstream = await fetch(url, { headers: GITHUB_HEADERS });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'GitHub API error' });
    }
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    console.error('GitHub proxy error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

router.get('/user/:username', (req, res) =>
  proxy(`https://api.github.com/users/${req.params.username}`, res)
);

router.get('/repos/:username', (req, res) =>
  proxy(
    `https://api.github.com/users/${req.params.username}/repos?sort=updated&per_page=12`,
    res
  )
);

module.exports = router;
