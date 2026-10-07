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
  comments:  make({ windowMs: 15 * 60 * 1000, max: 8,  message: { error: 'Too many comments. Slow down and try again.' } }),
  reactions: make({ windowMs: 60 * 1000,      max: 30, message: { error: 'Too many reactions. Slow down.' } }),
};
