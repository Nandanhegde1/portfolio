// Maps an i18n code to a natural-language hint appended to the LLM system prompt.
// Keep keys aligned with the frontend's SUPPORTED_LANGS list.
const NAMES = {
  en: 'English',
  es: 'Spanish (Español)',
  hi: 'Hindi (हिन्दी)',
  de: 'German (Deutsch)',
  ja: 'Japanese (日本語)',
};

function normalize(lang) {
  if (!lang || typeof lang !== 'string') return 'en';
  const l = lang.toLowerCase().slice(0, 2);
  return NAMES[l] ? l : 'en';
}

function languageInstruction(lang) {
  const code = normalize(lang);
  if (code === 'en') return ''; // default; no extra instruction
  return `\n\nIMPORTANT: Respond in ${NAMES[code]}. Keep all technical terms (framework names, language names, library names) in their original form.`;
}

module.exports = { normalize, languageInstruction };
