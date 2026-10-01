// The model behind the roast. Gemini when GEMINI_API_KEY is set, because its free
// tier keeps the feature running without a paid key; Anthropic otherwise.
// LLM_PROVIDER=gemini or LLM_PROVIDER=anthropic forces one.
const anthropic = require('./anthropic');
const gemini = require('./gemini');

function provider() {
  const forced = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (forced === 'gemini' || forced === 'anthropic') return forced;
  return process.env.GEMINI_API_KEY ? 'gemini' : 'anthropic';
}

function callModel(opts) {
  return provider() === 'gemini' ? gemini.callGemini(opts) : anthropic.callClaude(opts);
}

function streamModel(opts) {
  return provider() === 'gemini' ? gemini.streamGemini(opts) : anthropic.streamClaude(opts);
}

module.exports = { callModel, streamModel, provider };
