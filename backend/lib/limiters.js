const rateLimit = require('express-rate-limit');

const make = (opts) => rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  ...opts,
});

module.exports = {
  global:    make({ windowMs: 15 * 60 * 1000, max: 100 }),
  contact:   make({ windowMs: 60 * 60 * 1000, max: 5,  message: { error: 'Too many contact requests. Please try again later.' } }),
  chat:      make({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many chat requests. Please try again later.' } }),
  roast:     make({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many roast requests. Cool down and try again.' } }),
  guestbook: make({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many guestbook submissions. Try again later.' } }),
  comments:  make({ windowMs: 15 * 60 * 1000, max: 8,  message: { error: 'Too many comments. Slow down and try again.' } }),
  reactions: make({ windowMs: 60 * 1000,      max: 30, message: { error: 'Too many reactions. Slow down.' } }),
};
