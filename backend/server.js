const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { getSupabase } = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Root route (before middleware)
app.get('/', (_req, res) => {
  res.json({ message: 'Portfolio API', endpoints: ['/api/health', '/api/chat', '/api/roast', '/api/github/user/:username'] });
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'],
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '10kb' }));

// Debug: log every request
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GitHub proxy (avoids CORS + hides tokens)
app.get('/api/github/user/:username', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(req.params.username)}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` }),
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GitHub data' });
  }
});

app.get('/api/github/repos/:username', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(req.params.username)}/repos?per_page=100&sort=updated`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` }),
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Analytics endpoint (lightweight, no cookies)
app.post('/api/analytics', async (req, res) => {
  const { path } = req.body;
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const sanitizedPath = path.substring(0, 200);
  const sb = getSupabase();
  if (sb) {
    await sb.from('page_views').insert({
      path: sanitizedPath,
      referrer: req.get('referer') || null,
      user_agent: req.get('user-agent')?.substring(0, 500) || null,
      ip: req.ip,
    }).catch(() => {});
  }

  res.status(204).end();
});

app.get('/api/analytics/stats', async (_req, res) => {
  const sb = getSupabase();
  if (sb) {
    const { data: views } = await sb.from('page_views').select('path, created_at');
    const pages = {};
    (views || []).forEach(v => { pages[v.path] = (pages[v.path] || 0) + 1; });
    return res.json({
      totalPageViews: views?.length || 0,
      pages,
    });
  }
  res.json({ totalPageViews: 0, pages: {} });
});

// ── Recruiter outreach stats (read-only public view; data is hand-curated by Nandan)
app.get('/api/recruiter/stats', async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json({ total: 0, last30Days: 0, byCompany: {}, recent: [] });
  try {
    const { data, error } = await sb
      .from('recruiter_logs')
      .select('company, role, source, contacted_at')
      .order('contacted_at', { ascending: false })
      .limit(200);
    if (error) {
      console.error('[supabase] recruiter_logs read failed:', error.message);
      return res.json({ total: 0, last30Days: 0, byCompany: {}, recent: [] });
    }
    const rows = data || [];
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const byCompany = {};
    let last30Days = 0;
    rows.forEach((r) => {
      byCompany[r.company] = (byCompany[r.company] || 0) + 1;
      if (new Date(r.contacted_at).getTime() >= cutoff) last30Days += 1;
    });
    res.json({
      total: rows.length,
      last30Days,
      byCompany,
      recent: rows.slice(0, 10),
    });
  } catch (e) {
    console.error('[recruiter/stats] error:', e.message);
    res.json({ total: 0, last30Days: 0, byCompany: {}, recent: [] });
  }
});

// ── Interview pipeline stats (read-only public view; data is hand-curated by Nandan)
app.get('/api/interviews/stats', async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json({ total: 0, byStage: {}, byOutcome: {}, recent: [] });
  try {
    const { data, error } = await sb
      .from('interviews')
      .select('company, role, stage, outcome, interview_date')
      .order('interview_date', { ascending: false })
      .limit(200);
    if (error) {
      console.error('[supabase] interviews read failed:', error.message);
      return res.json({ total: 0, byStage: {}, byOutcome: {}, recent: [] });
    }
    const rows = data || [];
    const byStage = {};
    const byOutcome = {};
    rows.forEach((r) => {
      if (r.stage)   byStage[r.stage]     = (byStage[r.stage]   || 0) + 1;
      if (r.outcome) byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1;
    });
    res.json({
      total: rows.length,
      byStage,
      byOutcome,
      recent: rows.slice(0, 10),
    });
  } catch (e) {
    console.error('[interviews/stats] error:', e.message);
    res.json({ total: 0, byStage: {}, byOutcome: {}, recent: [] });
  }
});

// Contact form endpoint
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many contact requests. Please try again later.' },
});

// ── AI Chat endpoint (Claude via Anthropic API) ──
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many chat requests. Please try again later.' },
});

const SYSTEM_PROMPT = `You are Nandan Hegde's AI assistant on his portfolio website. Answer questions about him conversationally, warmly, and concisely (2-3 sentences max unless asked for detail).

ABOUT NANDAN:
- Senior Software Engineer with 6+ years of experience
- Currently at Thinkbridge Software Pvt Ltd (since March 2022), client: PSG Global Solutions
  - Led frontend development for Compass Application (Angular 17), a recruitment operations platform
  - Migrated legacy AngularJS to Angular 9, reduced initial load time by ~30%
  - Delivered 15+ features across 5 two-week sprints, 100% sprint deadlines
  - Engineered a browser extension (jQuery/JS) automating recruiting data collection for 500+ users
  - Designed real-time candidate data sync engine eliminating duplicate entries
  - 5,000+ test lines with Karma/Jasmine, 100% branch coverage for critical modules
  - Integrated Power BI, Microsoft SSO, and BandAI for 10,000+ monthly users
  - Architected CI/CD pipelines with Azure DevOps
  - Built a React.js prototype for AI calling agent "Anna" showcased at tradeshow in Austin, US
- Previously at Infosys (Jan 2020 - March 2022)
  - Swiss Re: Spearheaded UI modernization for Corflow Claims, a global insurance claims tool serving 40+ countries
  - Infosys Internal: Built Cloud Migration Accelerator with Node.js + Terraform (Azure, AWS, GCP)
  - High Performer in Foundation Program (82% score), MEAN Stack specialization
- AWS Certified Solutions Architect Associate
- B.E. in Electronics & Telecommunication, Dayananda Sagar College of Engineering, Bangalore (2019)
- Skills: Angular 17, TypeScript, RxJS, SCSS, Node.js, Azure DevOps, React.js, Power BI, Terraform, Docker, Kubernetes, Karma/Jasmine
- Based in Bangalore, India
- Open to senior frontend, full-stack, and lead roles

PERSONALITY: Friendly, concise, professional. Redirect off-topic questions politely. Be enthusiastic about opportunities but not desperate. Never make up facts.`;

app.post('/api/chat', chatLimiter, async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Chat service unavailable' });
  }

  try {
    // Build messages from history
    const messages = [];
    if (Array.isArray(history)) {
      for (const msg of history.slice(-10)) { // Last 10 messages for context
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: String(msg.content).slice(0, 1000) });
        }
      }
    }
    messages.push({ role: 'user', content: message.slice(0, 1000) });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';

    // Log chat to Supabase
    const sb = getSupabase();
    if (sb) {
      const { error: logErr } = await sb.from('chat_logs').insert({
        user_message: message.slice(0, 1000),
        ai_reply: reply.slice(0, 5000),
      });
      if (logErr) console.error('[supabase] chat_logs insert failed:', logErr.message, logErr.details || '', logErr.hint || '');
      else console.log('[supabase] chat_logs insert ok');
    } else {
      console.warn('[supabase] client unavailable for chat_logs insert (check SUPABASE_URL / SUPABASE_SERVICE_KEY)');
    }

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Roast My Stack AI endpoint ──
const roastLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many roast requests. Cool down and try again.' },
});

// ──────────────────────────────────────────────────────────────────────────
// Shared craft rules every roast must obey, regardless of intensity.
// Keeps comedy tight, on-topic, and screenshot-worthy without crossing
// into anything actually hurtful (no slurs, no punching down on people).
// ──────────────────────────────────────────────────────────────────────────
const ROAST_CRAFT_RULES = `
GOLDEN RULES (apply to EVERY roast, no exceptions):
1. PUNCH UP, NEVER DOWN. Roast the technology, the choices, the cliché — never the person, their identity, race, gender, age, body, or background. No slurs, no -isms, no cruelty.
2. SHOW YOU READ THE STACK. Name at least 2 specific things they wrote. Generic roasts are forbidden.
3. NO BULLET POINTS, NO LISTS, NO HEADINGS. Just flowing prose like a stand-up bit or a viral tweet.
4. NO META TALK. Never say "Here's a roast", "Sure, I'll roast you", or break character. Just open with the punchline.
5. END ON A PIVOT — a backhanded compliment, an accidentally motivational line, or a "but honestly..." reversal that makes them feel seen.
6. SPECIFIC > VAGUE. Reference real pain points: bundle size, config sprawl, version churn, hiring market, DX drama, framework wars, the 47-line docker-compose, whatever fits.
7. KEEP IT SHARABLE. The victim should WANT to screenshot this. If it sounds like a LinkedIn motivational post or a Reddit comment fight, you failed.

STYLE PALETTE — mix and match, do NOT use all in one roast:
• QUIRKY: absurdist analogies, surreal scenarios, weird hypotheticals ("your useEffect runs in three timezones")
• OBSERVATIONAL: painfully accurate dev-life truths everyone knows but nobody says
• ROAST-BATTLE: rapid-fire one-liners, callback structure, escalating burns
• CORPORATE-CORE: HR-speak weaponized ("we'd love to align on why your bundle is 4MB")
• FAKE-DIALOGUE: invented scene with PM / intern / DevOps / future-self
• POP-CULTURE: a fitting movie/show/meme reference (sparingly, max one per roast)
`;

const ROAST_PROMPTS = {
  mild: `You are a tech comedian doing a LIGHT roast — the kind of teasing you'd do at a friend's birthday, not their funeral.

${ROAST_CRAFT_RULES}

LENGTH: 2–3 sentences. Punchy. Tweet-sized.
TONE: Playful. Affectionate. 80% jab, 20% hug. Reader should laugh and feel seen, not attacked.
STRUCTURE: Open with a relatable observation about their stack → one specific funny callout → end with a genuine-but-cheeky compliment.
REQUIRED FLAVOR: pick ONE from {quirky, observational, pop-culture}.

GREAT MILD EXAMPLES (match this calibration):
• "Next.js + Tailwind + Vercel — the holy trinity of devs who say 'I just want to ship'. You probably named your side project something with '.dev' in the URL. Honestly though, your Lighthouse score is unbothered."
• "Vue + Pinia + Vite. You're that one dev who quietly built something amazing while React Twitter was busy fighting about server components. Respect — except for the part where you keep trying to convert your friends."
• "Django + Postgres + a single Dockerfile. The 'I sleep at night' stack. Your code is boring in the best way possible, and your on-call rotations probably go unnoticed. Boring is a flex.""`,

  medium: `You are a sharp tech comedian doing a MEDIUM roast — comedy special energy. Funny, specific, quotable.

${ROAST_CRAFT_RULES}

LENGTH: 3–4 sentences. Each line should be screenshot-able on its own.
TONE: Witty, observational, slightly mean but never cruel. Think: "OH that's brutal" followed by laughter.
STRUCTURE: Open with a one-line gut-punch → one absurd analogy or fake scenario → one painfully specific callout → close with a backhanded compliment OR an accidentally true compliment.
REACTION OPENERS welcome (use AT MOST one): "Bro.", "Sir.", "Look.", "Respectfully,", "My guy.", "Buddy."
REQUIRED FLAVOR: pick TWO from {quirky, observational, fake-dialogue, corporate-core, pop-culture, roast-battle}.

GREAT MEDIUM EXAMPLES (match this calibration):
• "Bro said React, Redux, Redux Toolkit, Redux Saga, Redux Thunk, and Redux Persist. You don't have a tech stack, you have a Redux support group. Your state management has state management — at this point your boolean has a therapist on retainer. But honestly, you'll never lose track of a flag in your life."
• "PHP, jQuery, MySQL in 2026. Respectfully, your stack has a LinkedIn 'Open to Work' banner since 2014. You're the digital fax machine — universally mocked, eternally functional, somehow still running 78% of the internet. The joke's on us, actually."
• "Vue + Nuxt + Pinia + Tailwind + Supabase. The 'I read one blog post and mass-mortgaged my startup on it' stack. Your DX is so smooth you've literally never met a production bug, which is wild because you ship every Friday at 5pm. Genuinely though — this stack slaps."`,

  savage: `You are an UNHINGED tech roast comedian. Maximum heat. Comedy Central Roast energy. Nothing is sacred — except actual people.

${ROAST_CRAFT_RULES}

LENGTH: 4–5 sentences of PURE FIRE. No filler.
TONE: Devastating but joyful. Every line earns an audible "OHHHH". The victim should be dying laughing while screenshotting it themselves.
STRUCTURE: Open NUCLEAR → escalate with a fake conversation or absurd scenario → drop one painfully specific dev-truth → land an analogy that's so cursed it loops back to genius → close with a line that's weirdly profound, accidentally motivational, or a perfect mic-drop.
REQUIRED FLAVOR: pick THREE from {quirky, observational, fake-dialogue, corporate-core, pop-culture, roast-battle}. Mix high and low. Make it weird.
HARD BANS (still apply): no slurs, no body shaming, no attacking identity, no "your mom" jokes, no real names of devs/companies as targets. Roast the CHOICES.

GREAT SAVAGE EXAMPLES (match this calibration):
• "Java, Spring Boot, Kafka, Kubernetes, Oracle. Sir, this isn't a tech stack — this is a hostile takeover. You need 47 annotations to say hello and every one requires a Jira ticket, two committee meetings, and a TPS report. Your PM asked for an MVP and you scheduled a 6-week architecture review followed by a vendor RFP. Your AbstractSingletonProxyFactoryBeanFactory called — it wants its own LinkedIn profile. But real talk: when civilization collapses, your monolith will be the last thing humming in a bunker, and you'll bill it overtime."
• "React, TypeScript, Tailwind, Prisma, tRPC, Vercel. You've built your entire personality around type safety, dark mode, and zero-config deploys. Your 'quick prototype' has 14 npm packages, a Storybook, three GitHub Actions, and a Notion roadmap — all to render a button. You've never written vanilla CSS and you sleep like a baby. Your standup answer is 'shipping today' and 'today' is a moving target the size of the Pacific. Honestly though? Your DX is so clean it's making the rest of us feel poor."
• "Bun, Hono, Drizzle, Astro, Cloudflare Workers, ngrok, htmx. Buddy. You don't have a stack, you have a manifesto. You've changed your bio three times this month and your README has a 'why I left React' section longer than the actual code. You're going to give a conference talk titled 'The Edge Is The New Frontend' and 11 people will applaud. But you know what — in three years half of dev Twitter will be doing this, so go off, prophet."`
};

app.post('/api/roast', roastLimiter, async (req, res) => {
  const { stack, intensity } = req.body;

  if (!stack || typeof stack !== 'string' || stack.length > 500) {
    return res.status(400).json({ error: 'Invalid stack. Keep it under 500 characters.' });
  }

  const level = ['mild', 'medium', 'savage'].includes(intensity) ? intensity : 'medium';

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Roast service unavailable' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        temperature: 1,
        system: ROAST_PROMPTS[level],
        messages: [{ role: 'user', content: `Roast this tech stack (${level} intensity, go ALL IN): ${stack.slice(0, 500)}` }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Roast API error:', response.status, errorBody);
      return res.status(502).json({ error: 'Roast service error' });
    }

    const data = await response.json();
    const roast = data.content?.[0]?.text || 'Your stack is so mid, even AI refuses to roast it.';

    // Log roast to Supabase
    const sb = getSupabase();
    if (sb) {
      const { error: logErr } = await sb.from('roast_logs').insert({
        stack: stack.slice(0, 500),
        intensity: level,
        roast: roast.slice(0, 5000),
      });
      if (logErr) console.error('[supabase] roast_logs insert failed:', logErr.message, logErr.details || '', logErr.hint || '');
      else console.log('[supabase] roast_logs insert ok');
    } else {
      console.warn('[supabase] client unavailable for roast_logs insert');
    }

    res.json({ roast });
  } catch (error) {
    console.error('Roast error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  console.log('Contact form submission:', { name, email, subject, message: message.substring(0, 500) });

  const sb = getSupabase();
  if (sb) {
    const { error: logErr } = await sb.from('contacts').insert({
      name: name.substring(0, 200),
      email: email.substring(0, 200),
      subject: subject.substring(0, 500),
      message: message.substring(0, 5000),
      ip: req.ip,
    });
    if (logErr) console.error('[supabase] contacts insert failed:', logErr.message, logErr.details || '', logErr.hint || '');
    else console.log('[supabase] contacts insert ok');
  } else {
    console.warn('[supabase] client unavailable for contacts insert');
  }

  res.json({ success: true, message: 'Message received!' });
});

// ── Guestbook endpoints ──
const guestbookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many guestbook submissions. Try again later.' },
});

app.get('/api/guestbook', async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json([]);
  const { data, error } = await sb.from('guestbook').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: 'Failed to fetch guestbook' });
  res.json(data);
});

app.post('/api/guestbook', guestbookLimiter, async (req, res) => {
  const { name, message, emoji } = req.body;
  if (!name || !message || typeof name !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ error: 'Name and message are required' });
  }
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Guestbook unavailable' });
  const { data, error } = await sb.from('guestbook').insert({
    name: name.substring(0, 100),
    message: message.substring(0, 1000),
    emoji: (emoji || '👍').substring(0, 10),
  }).select().single();
  if (error) return res.status(500).json({ error: 'Failed to save entry' });
  res.json(data);
});

// ── Recruiter Tracker ──
app.get('/api/recruiter/stats', async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json({ total: 0, last30Days: 0, byCompany: {}, recent: [] });

  const { data } = await sb.from('recruiter_logs').select('*').order('contacted_at', { ascending: false });
  const all = data || [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000);
  const byCompany = {};
  all.forEach(r => { byCompany[r.company || 'Unknown'] = (byCompany[r.company || 'Unknown'] || 0) + 1; });

  res.json({
    total: all.length,
    last30Days: all.filter(r => new Date(r.contacted_at) >= thirtyDaysAgo).length,
    byCompany,
    recent: all.slice(0, 5).map(r => ({
      company: r.company,
      role: r.role,
      contacted_at: r.contacted_at,
      source: r.source,
    })),
  });
});

app.post('/api/recruiter/log', async (req, res) => {
  if (req.query.key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const { company, role, source, contacted_at, notes } = req.body;
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'DB unavailable' });
  const { data, error } = await sb.from('recruiter_logs').insert({
    company: (company || 'Unknown').substring(0, 200),
    role: (role || '').substring(0, 200),
    source: (source || '').substring(0, 100),
    contacted_at: contacted_at || new Date().toISOString(),
    notes: (notes || '').substring(0, 1000),
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Interview Tracker ──
app.get('/api/interviews/stats', async (_req, res) => {
  const sb = getSupabase();
  if (!sb) return res.json({ total: 0, byStage: {}, byOutcome: {}, recent: [] });

  const { data } = await sb.from('interviews').select('*').order('interview_date', { ascending: false });
  const all = data || [];
  const byStage = {};
  const byOutcome = {};
  all.forEach(i => {
    byStage[i.stage || 'Unknown'] = (byStage[i.stage || 'Unknown'] || 0) + 1;
    byOutcome[i.outcome || 'Pending'] = (byOutcome[i.outcome || 'Pending'] || 0) + 1;
  });

  res.json({
    total: all.length,
    byStage,
    byOutcome,
    recent: all.slice(0, 5).map(i => ({
      company: i.company,
      stage: i.stage,
      outcome: i.outcome,
      interview_date: i.interview_date,
    })),
  });
});

app.post('/api/interviews/log', async (req, res) => {
  if (req.query.key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const { company, role, stage, outcome, interview_date, notes } = req.body;
  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'DB unavailable' });
  const { data, error } = await sb.from('interviews').insert({
    company: (company || 'Unknown').substring(0, 200),
    role: (role || '').substring(0, 200),
    stage: (stage || 'Applied').substring(0, 50),
    outcome: (outcome || 'Pending').substring(0, 50),
    interview_date: interview_date || new Date().toISOString(),
    notes: (notes || '').substring(0, 1000),
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Spotify proxy (uses Refresh Token Flow) ──
let spotifyTokenCache = { token: null, expiresAt: 0 };

async function getSpotifyToken() {
  if (spotifyTokenCache.token && Date.now() < spotifyTokenCache.expiresAt) return spotifyTokenCache.token;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  });
  if (!response.ok) return null;
  const data = await response.json();
  spotifyTokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

app.get('/api/spotify/now-playing', async (_req, res) => {
  const token = await getSpotifyToken();
  if (!token) return res.json({ isPlaying: false, mock: true });

  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.status === 204) return res.json({ isPlaying: false });
    if (!response.ok) return res.json({ isPlaying: false });
    const data = await response.json();
    res.json({
      isPlaying: data.is_playing,
      title: data.item?.name,
      artist: data.item?.artists?.map(a => a.name).join(', '),
      album: data.item?.album?.name,
      albumArt: data.item?.album?.images?.[0]?.url,
      progress: data.progress_ms,
      duration: data.item?.duration_ms,
      url: data.item?.external_urls?.spotify,
    });
  } catch {
    res.json({ isPlaying: false });
  }
});

// ── Admin: view all data ──
app.get('/api/admin/contacts', async (req, res) => {
  if (req.query.key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const sb = getSupabase();
  if (!sb) return res.json([]);
  const { data } = await sb.from('contacts').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

app.get('/api/admin/chat-logs', async (req, res) => {
  if (req.query.key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const sb = getSupabase();
  if (!sb) return res.json([]);
  const { data } = await sb.from('chat_logs').select('*').order('created_at', { ascending: false }).limit(200);
  res.json(data || []);
});

app.get('/api/admin/roast-logs', async (req, res) => {
  if (req.query.key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const sb = getSupabase();
  if (!sb) return res.json([]);
  const { data } = await sb.from('roast_logs').select('*').order('created_at', { ascending: false }).limit(200);
  res.json(data || []);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio API running on port ${PORT}`);
});
