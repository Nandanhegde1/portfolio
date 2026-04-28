const express = require('express');
const { getNowPlaying } = require('../lib/spotify');

const router = express.Router();

router.get('/now-playing', async (_req, res) => {
  res.json(await getNowPlaying());
});

module.exports = router;
