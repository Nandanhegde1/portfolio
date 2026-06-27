import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

interface ArchNode {
  id: string;
  label: string;
  desc: string;
  icon: string;
  tech: string[];
  layer: 'edge' | 'frontend' | 'backend' | 'data' | 'ai' | 'infra';
}

interface NodePos {
  id: string;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
}

interface FlowScenario {
  id: string;
  label: string;
  description: string;
  hops: string[]; // node ids in order
  color: string;
}

interface PerfMetric {
  label: string;
  value: string;
  detail: string;
  color: string;
}

interface PipelineStep {
  step: number;
  name: string;
  cmd: string;
  desc: string;
  duration: string;
}

@Component({
  selector: 'app-under-the-hood',
  standalone: true,
  imports: [RouterLink, UpperCasePipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './under-the-hood.component.html',
  styleUrl: './under-the-hood.component.scss',
})
export class UnderTheHoodComponent {
  readonly activeTab = signal<'arch' | 'perf' | 'cicd' | 'seo' | 'sec'>('arch');

  setTab(t: 'arch' | 'perf' | 'cicd' | 'seo' | 'sec'): void {
    this.activeTab.set(t);
  }

  readonly archNodes: ArchNode[] = [
    {
      id: 'cdn', label: 'GitHub Pages CDN', icon: '🌐', layer: 'edge',
      desc: 'Static frontend served from edge servers, ~50ms TTFB globally.',
      tech: ['GitHub Pages', 'Cloudflare DNS', 'HTTPS'],
    },
    {
      id: 'spa', label: 'Angular 19 SPA', icon: '⚡', layer: 'frontend',
      desc: 'Standalone components, signals, new control flow, lazy-loaded routes with PreloadAllModules.',
      tech: ['Angular 19.2', 'TypeScript 5.7', 'RxJS', 'Signals', 'OnPush'],
    },
    {
      id: 'three', label: 'Three.js Hero', icon: '🎨', layer: 'frontend',
      desc: 'WebGL particle system. Deferred via @defer, mobile-aware count, pauses on hidden tab.',
      tech: ['Three.js', 'WebGL', '@defer', 'IntersectionObserver'],
    },
    {
      id: 'api', label: 'Express API', icon: '🚀', layer: 'backend',
      desc: 'Node 22 + Express. Rate-limited per route. Warmed up by frontend ping every 10 min.',
      tech: ['Node 22', 'Express 5', 'Helmet', 'express-rate-limit', 'CORS allowlist'],
    },
    {
      id: 'render', label: 'Render Hosting', icon: '☁️', layer: 'infra',
      desc: 'Auto-deploys on push to main. Free-tier with health-check warmup.',
      tech: ['Render', 'Auto-deploy', 'HTTPS', 'Env secrets'],
    },
    {
      id: 'supa', label: 'Supabase Postgres', icon: '🗄️', layer: 'data',
      desc: 'Managed Postgres for guestbook, analytics, recruiter logs, chat history.',
      tech: ['Postgres 15', 'Row-level security', 'REST API', 'Realtime'],
    },
    {
      id: 'claude', label: 'Anthropic Claude', icon: '🧠', layer: 'ai',
      desc: 'Sonnet 4.5 powers the lab roast experiment. Streaming SSE responses.',
      tech: ['claude-sonnet-4-5', 'System prompts', 'Streaming-ready'],
    },
    {
      id: 'github', label: 'GitHub REST API', icon: '🐙', layer: 'data',
      desc: 'Live repo activity, language and star stats. Cached 1h in localStorage.',
      tech: ['REST v3', 'localStorage cache', 'Conditional GET'],
    },
    {
      id: 'spotify', label: 'Spotify API', icon: '🎵', layer: 'data',
      desc: 'OAuth refresh-token flow proxied through backend to expose now-playing.',
      tech: ['OAuth 2.0', 'Refresh token', 'Backend proxy'],
    },
  ];

  readonly lighthouse = [
    { label: 'Performance',    value: 98,  color: '#0cce6b' },
    { label: 'Accessibility',  value: 100, color: '#0cce6b' },
    { label: 'Best Practices', value: 100, color: '#0cce6b' },
    { label: 'SEO',            value: 100, color: '#0cce6b' },
  ];

  readonly perfMetrics: PerfMetric[] = [
    { label: 'Lighthouse Performance', value: '98', detail: 'Mobile, throttled 4G', color: '#16a34a' },
    { label: 'Initial Bundle (gzip)', value: '90 KB', detail: 'Below 100 KB budget', color: '#16a34a' },
    { label: 'Time to Interactive', value: '< 1.2s', detail: 'Cable connection', color: '#16a34a' },
    { label: 'First Contentful Paint', value: '0.6s', detail: 'Render-blocking minimised', color: '#16a34a' },
    { label: 'CLS (Layout Shift)', value: '0.00', detail: 'No layout shift', color: '#16a34a' },
    { label: 'API Cold Start', value: '~30s → 0s', detail: 'Killed by warmup ping', color: '#6c63ff' },
  ];

  readonly perfTechniques = [
    { icon: '🔮', title: 'Route Preloading', desc: 'PreloadAllModules fetches every lazy chunk after initial nav, so subsequent route clicks are instant.' },
    { icon: '⚡', title: 'View Transitions API', desc: 'Native browser route morphs (Chrome/Edge). Falls back gracefully elsewhere.' },
    { icon: '🎯', title: 'IntersectionObserver @defer', desc: 'Three.js (~150KB) only loads when hero scrolls into viewport, with idle prefetch.' },
    { icon: '🔌', title: 'Preconnect Hints', desc: '<link rel="preconnect"> to Render, GitHub, Spotify shaves ~200ms off first request.' },
    { icon: '🌙', title: 'Tab-Hidden Pause', desc: 'WebGL animation + API polling pause when document.hidden — saves CPU + battery.' },
    { icon: '💾', title: 'Smart Caching', desc: 'GitHub responses cached 1h in localStorage. Service Worker for offline shell.' },
    { icon: '📱', title: 'Adaptive Quality', desc: 'Three.js particle count halves on mobile / low-memory devices (deviceMemory ≤ 4).' },
    { icon: '🎨', title: 'CSS-Only Skeletons', desc: 'No JS needed for loading states — pure CSS keyframes on the GPU compositor.' },
  ];

  readonly cicdSteps: PipelineStep[] = [
    { step: 1, name: 'Push to main', cmd: 'git push origin main', desc: 'Triggers GitHub webhook + Render webhook simultaneously.', duration: '< 1s' },
    { step: 2, name: 'Frontend Build', cmd: 'npx ng build --configuration=production', desc: 'AOT compile, tree-shake, minify, hash assets, generate sourcemaps.', duration: '~45s' },
    { step: 3, name: 'Bundle Audit', cmd: 'Built-in size budgets', desc: 'Fails build if initial > 500KB or component > 6KB. Keeps the site fast.', duration: '< 1s' },
    { step: 4, name: 'Deploy to GH Pages', cmd: 'npx angular-cli-ghpages', desc: 'Pushes built artifacts to gh-pages branch, served from edge CDN.', duration: '~30s' },
    { step: 5, name: 'Backend Deploy', cmd: 'Render auto-deploy', desc: 'Render picks up backend/ changes, runs npm install + node server.js, zero-downtime swap.', duration: '~90s' },
    { step: 6, name: 'Health Check', cmd: 'GET /api/health', desc: 'Frontend pings backend on app load, warming the dyno before users open the lab.', duration: '< 100ms' },
  ];

  readonly seoSignals = [
    { icon: '📋', title: 'Schema.org Person', desc: 'JSON-LD structured data tells search engines exactly who I am: name, role, employer, skills, certs.' },
    { icon: '🔗', title: 'Per-Route Meta Tags', desc: 'Title, description, canonical, OG, Twitter cards updated on every navigation via SeoService.' },
    { icon: '🖼️', title: 'OG Images (1200×630)', desc: 'Custom Open Graph image so LinkedIn / Twitter previews look polished.' },
    { icon: '📜', title: 'Robots.txt + Sitemap', desc: 'Explicit sitemap.xml with all routes; robots.txt allows full crawl.' },
    { icon: '🌍', title: 'Hreflang + Locale', desc: 'en_US locale declared. Ready for multi-locale expansion.' },
    { icon: '⚡', title: 'Core Web Vitals', desc: 'LCP < 1s, CLS 0, INP < 200ms — Google\'s ranking signals nailed.' },
    { icon: '🔍', title: 'Semantic HTML', desc: 'Proper <main>, <nav>, <article>, <section>, ARIA labels, skip-to-content links.' },
    { icon: '📱', title: 'Mobile-First Indexing', desc: 'Responsive design, touch targets ≥ 44px, readable text without zoom.' },
  ];

  readonly securityFeatures = [
    { icon: '🛡️', title: 'Helmet Headers', desc: 'CSP, X-Frame-Options, HSTS, X-Content-Type-Options on every backend response.' },
    { icon: '🚦', title: 'Rate Limiting', desc: 'Per-IP limits: chat 20/15min, roast 20/15min, contact 5/15min, guestbook 10/15min.' },
    { icon: '🔐', title: 'Secret Management', desc: 'API keys never touch the client. All Anthropic/Spotify calls proxied through backend.' },
    { icon: '🌐', title: 'CORS Allowlist', desc: 'Only nandanhegde1.github.io + localhost can call the API. Unknown origins get 403.' },
    { icon: '🧹', title: 'Input Sanitisation', desc: 'Length caps on every field, regex email validation, basic profanity filter on guestbook.' },
    { icon: '🔒', title: 'XSS Protection', desc: 'Angular auto-escapes templates. DomSanitizer used only when explicitly required.' },
    { icon: '🍪', title: 'Cookieless Analytics', desc: 'No tracking cookies. Anonymous page-view counts via localStorage + backend log.' },
    { icon: '✅', title: 'OWASP Top 10 Audit', desc: 'Reviewed against injection, broken auth, sensitive data, XSS, CSRF, SSRF, dependency CVEs.' },
  ];

  // Computed: nodes filtered by current tab visualisation
  readonly archByLayer = computed(() => {
    const layers: ArchNode['layer'][] = ['edge', 'frontend', 'backend', 'ai', 'data', 'infra'];
    return layers.map((layer) => ({
      layer,
      label: this.layerLabel(layer),
      color: this.layerColor(layer),
      nodes: this.archNodes.filter((n) => n.layer === layer),
    }));
  });

  private layerLabel(l: ArchNode['layer']): string {
    return { edge: 'Edge', frontend: 'Frontend', backend: 'Backend', data: 'Data', ai: 'AI', infra: 'Infrastructure' }[l];
  }

  private layerColor(l: ArchNode['layer']): string {
    return { edge: '#06b6d4', frontend: '#6c63ff', backend: '#10b981', data: '#f59e0b', ai: '#ec4899', infra: '#8b5cf6' }[l];
  }

  // ── INTERACTIVE TOPOLOGY ──────────────────────────────────────
  // SVG-space coordinates (viewBox 0 0 1000 540) for each architecture node.
  // Layers run left-to-right: User -> Edge -> Frontend -> Backend -> external services.
  readonly viewW = 1000;
  readonly viewH = 540;

  readonly nodePositions: NodePos[] = [
    { id: 'user',    x: 80,  y: 270 },
    { id: 'cdn',     x: 240, y: 270 },
    { id: 'spa',     x: 420, y: 200 },
    { id: 'three',   x: 420, y: 360 },
    { id: 'api',     x: 620, y: 270 },
    { id: 'render',  x: 620, y: 90  },
    { id: 'supa',    x: 860, y: 110 },
    { id: 'claude',  x: 860, y: 230 },
    { id: 'github',  x: 860, y: 350 },
    { id: 'spotify', x: 860, y: 460 },
  ];

  readonly edges: Edge[] = [
    { from: 'user',   to: 'cdn'     },
    { from: 'cdn',    to: 'spa'     },
    { from: 'cdn',    to: 'three'   },
    { from: 'spa',    to: 'api'     },
    { from: 'three',  to: 'api'     },
    { from: 'render', to: 'api'     },
    { from: 'api',    to: 'supa'    },
    { from: 'api',    to: 'claude'  },
    { from: 'api',    to: 'github'  },
    { from: 'api',    to: 'spotify' },
  ];

  readonly flows: FlowScenario[] = [
    {
      id: 'page-load',
      label: 'Loading this page',
      description: 'You hit the URL. CDN serves the SPA shell, browser hydrates, Three.js lazy-loads after first paint.',
      hops: ['user', 'cdn', 'spa', 'three'],
      color: '#06b6d4',
    },
    {
      id: 'ai-chat',
      label: 'Opening the lab',
      description: 'Your message goes to the API, which proxies to Claude with a system prompt and logs the conversation in Postgres.',
      hops: ['user', 'cdn', 'spa', 'api', 'claude', 'supa'],
      color: '#ec4899',
    },
    {
      id: 'roast',
      label: 'Roasting a stack',
      description: 'API streams Claude tokens back over Server-Sent Events; the UI types out the roast in real time.',
      hops: ['user', 'spa', 'api', 'claude', 'spa'],
      color: '#f59e0b',
    },
    {
      id: 'github',
      label: 'Live GitHub stats',
      description: 'Dashboard requests recent activity. API hits the GitHub REST proxy; result is cached for an hour.',
      hops: ['user', 'spa', 'api', 'github'],
      color: '#10b981',
    },
  ];

  readonly selectedFlowId = signal<string>('page-load');
  readonly selectedNodeId = signal<string | null>(null);

  readonly selectedFlow = computed(() =>
    this.flows.find(f => f.id === this.selectedFlowId()) ?? this.flows[0]
  );

  readonly selectedNode = computed<ArchNode | null>(() => {
    const id = this.selectedNodeId();
    if (!id || id === 'user') return null;
    return this.archNodes.find(n => n.id === id) ?? null;
  });

  readonly flowEdges = computed(() => {
    const hops = this.selectedFlow().hops;
    const set = new Set<string>();
    for (let i = 0; i < hops.length - 1; i++) {
      set.add(`${hops[i]}->${hops[i + 1]}`);
      set.add(`${hops[i + 1]}->${hops[i]}`); // bidirectional highlight
    }
    return set;
  });

  readonly flowNodes = computed(() => new Set(this.selectedFlow().hops));

  selectFlow(id: string): void {
    this.selectedFlowId.set(id);
    this.selectedNodeId.set(null);
  }

  selectNode(id: string): void {
    this.selectedNodeId.set(this.selectedNodeId() === id ? null : id);
  }

  posOf(id: string): NodePos {
    return this.nodePositions.find(p => p.id === id) ?? { id, x: 0, y: 0 };
  }

  // SVG path between two nodes — gentle horizontal cubic bezier so flows curve nicely.
  edgePath(from: string, to: string): string {
    const a = this.posOf(from);
    const b = this.posOf(to);
    const dx = (b.x - a.x) * 0.45;
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  }

  isEdgeActive(from: string, to: string): boolean {
    return this.flowEdges().has(`${from}->${to}`);
  }

  isNodeInFlow(id: string): boolean {
    return this.flowNodes().has(id);
  }

  // Stagger animation delay per hop so the dot appears to travel through the chain.
  hopDelay(index: number): string {
    return `${index * 0.7}s`;
  }

  pathHops(): { from: string; to: string }[] {
    const hops = this.selectedFlow().hops;
    const result: { from: string; to: string }[] = [];
    for (let i = 0; i < hops.length - 1; i++) {
      result.push({ from: hops[i], to: hops[i + 1] });
    }
    return result;
  }

  nodeDisplay(id: string): { label: string; icon: string } {
    if (id === 'user') return { label: 'You', icon: '👤' };
    const n = this.archNodes.find(x => x.id === id);
    return n ? { label: n.label, icon: n.icon } : { label: id, icon: '•' };
  }

  nodeColor(id: string): string {
    if (id === 'user') return '#ffffff';
    const n = this.archNodes.find(x => x.id === id);
    return n ? this.layerColor(n.layer) : '#888';
  }
}
