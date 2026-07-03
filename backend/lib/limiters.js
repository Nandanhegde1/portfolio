const rateLimit = require('express-rate-limit');

const make = (opts) => rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  ...opts,
});

// ── Global daily LLM budget ─────────────────────────────────────────────
// Per-IP limits bound one abuser, not total Anthropic spend: N distinct IPs
// could still generate N×20 roasts per window. This caps total LLM calls per
// UTC day across ALL clients. In-memory is correct here — Render runs a single
// instance, and a restart resetting the counter only errs generous.
const DAILY_LLM_CALL_CAP = Number(process.env.DAILY_LLM_CALL_CAP || 300);
let dailyCount = 0;
let dailyKey = new Date().toISOString().slice(0, 10);

function llmDailyBudget(_req, res, next) {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyKey) {
    dailyKey = today;
    dailyCount = 0;
  }
  if (dailyCount >= DAILY_LLM_CALL_CAP) {
    return res.status(429).json({
      error: 'Daily AI budget reached — the roast and chat are back tomorrow (UTC). Everything else still works.',
    });
  }
  dailyCount++;
  next();
}

module.exports = {
  global:    make({ windowMs: 15 * 60 * 1000, max: 100 }),
  contact:   make({ windowMs: 60 * 60 * 1000, max: 5,  message: { error: 'Too many contact requests. Please try again later.' } }),
  chat:      make({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many chat requests. Please try again later.' } }),
  roast:     make({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many roast requests. Cool down and try again.' } }),
  guestbook: make({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many guestbook submissions. Try again later.' } }),
  comments:  make({ windowMs: 15 * 60 * 1000, max: 8,  message: { error: 'Too many comments. Slow down and try again.' } }),
  reactions: make({ windowMs: 60 * 1000,      max: 30, message: { error: 'Too many reactions. Slow down.' } }),
  llmDailyBudget,
};
