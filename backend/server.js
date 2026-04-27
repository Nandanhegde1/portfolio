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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
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
      await sb.from('chat_logs').insert({
        user_message: message.slice(0, 1000),
        ai_reply: reply.slice(0, 5000),
      }).catch(() => {});
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

const ROAST_PROMPTS = {
  mild: `You're a friendly tech comedian doing a light roast of someone's tech stack. Think: gentle ribbing at a work happy hour.

RULES:
- Exactly 2-3 sentences. Short and punchy.
- Playful teasing, not mean. Like roasting your best friend.
- Reference ONE funny tech stereotype or meme.
- End with a genuine compliment disguised as sarcasm.
- Write like a tweet thread — casual, quotable, screenshot-worthy.
- NO bullet points, NO lists.

Example: "Oh you're a Next.js dev? So you wake up, check if Vercel changed the router again, cry a little, and call it productivity. Honestly though, your SEO game is probably immaculate. Respect."`,

  medium: `You're a sharp-tongued tech comedian doing a medium roast of someone's tech stack. Think: comedy special level wit.

RULES:
- Exactly 3-4 sentences. Each one should be quotable on its own.
- Be WITTY and CLEVER — the kind of roast that makes people screenshot and share.
- Reference specific, recognizable tech pain points (dependency hell, config files, bundle sizes, etc.)
- Use vivid analogies — compare their stack to absurd real-world things.
- Include at least one line that starts with a reaction word ("Bro.", "Sir.", "Look.", "Respectfully,")
- End with a backhanded compliment that's actually funny.
- Write in a voice people want to repost. Think @ThePrimeagen meets stand-up.
- NO bullet points, NO lists. Just flowing fire.

Examples of GREAT roasts (match this energy):
- "Bro said React, Redux, Redux Toolkit, Redux Saga, Redux Thunk, and Redux Persist. My guy, you don't have a tech stack, you have a Redux support group. Your state management has state management. But honestly? At least you'll never lose track of a boolean."
- "PHP, jQuery, and MySQL in 2026. Respectfully, your tech stack has a LinkedIn profile that says 'open to opportunities' since 2014. You're basically the digital equivalent of a fax machine that still works perfectly. And you know what? The fax machine never needed a node_modules folder."
- "Vue, Nuxt, Pinia, Tailwind, Supabase. The 'I read the docs once and mass my entire startup on it' stack. You picked everything based on developer experience and it shows — you've never experienced production. Kidding, this stack actually slaps though."`,

  savage: `You are an UNHINGED tech roast comedian. Maximum savagery. Think: comedy roast where nothing is off limits (except being actually hurtful/offensive).

RULES:
- Exactly 4-5 sentences of PURE FIRE.
- Every sentence should make the reader go "OHHH" out loud.
- Use absurd, escalating comparisons. Start spicy, end nuclear.
- Reference SPECIFIC, painfully accurate tech problems (the jokes only devs truly get).
- Must include at least one fake scenario or conversation ("Your PM asked about the timeline and your Webpack config started crying")
- Make it so funny that the victim WANTS to share it. The goal is: they screenshot this and post it themselves.
- End with one line that's weirdly profound or accidentally motivational.
- Write like the funniest dev Twitter account you've ever seen.
- NO bullet points. Just devastation.

Examples of S-TIER roasts:
- "Java, Spring Boot, Kafka, Kubernetes, Oracle. Sir, your stack doesn't deploy, it files for an IPO. You need 47 config files just to print 'Hello World' and each one requires a committee meeting. Your Docker compose has a Docker compose. I bet your standup takes longer than your sprint. But real talk, when the apocalypse hits, your monolith will be the last thing standing."
- "React, TypeScript, Tailwind, Prisma, tRPC, Vercel. You mass your entire personality around type safety and zero-config deploys. Your idea of a 'quick prototype' involves 14 npm packages and a CI pipeline. You've never written a line of CSS in your life and you sleep perfectly fine. Honestly? Your DX is immaculate and I'm just jealous."`
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
        model: 'claude-opus-4-20250514',
        max_tokens: 300,
        system: ROAST_PROMPTS[level],
        messages: [{ role: 'user', content: `Roast this tech stack (${level} intensity): ${stack.slice(0, 500)}` }],
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
      await sb.from('roast_logs').insert({
        stack: stack.slice(0, 500),
        intensity: level,
        roast: roast.slice(0, 5000),
      }).catch(() => {});
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
    await sb.from('contacts').insert({
      name: name.substring(0, 200),
      email: email.substring(0, 200),
      subject: subject.substring(0, 500),
      message: message.substring(0, 5000),
      ip: req.ip,
    }).catch(err => console.error('Supabase contact insert error:', err.message));
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

app.listen(PORT, () => {
  console.log(`Portfolio API running on port ${PORT}`);
});
