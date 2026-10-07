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
  layer: 'edge' | 'frontend' | 'backend' | 'data' | 'infra';
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
      desc: 'Static frontend served from GitHub\'s edge servers over HTTPS.',
      tech: ['GitHub Pages', 'GitHub Actions', 'HTTPS'],
    },
    {
      id: 'spa', label: 'Angular 19 SPA', icon: '⚡', layer: 'frontend',
      desc: 'Standalone components, signals, new control flow, lazy-loaded routes with PreloadAllModules.',
      tech: ['Angular 19.2', 'TypeScript 5.6', 'RxJS', 'Signals', 'OnPush'],
    },
    {
      id: 'three', label: 'Three.js Hero', icon: '🎨', layer: 'frontend',
      desc: 'WebGL particle system. Deferred via @defer, mobile-aware count, pauses on hidden tab.',
      tech: ['Three.js', 'WebGL', '@defer', 'IntersectionObserver'],
    },
    {
      id: 'api', label: 'Express API', icon: '🚀', layer: 'backend',
      desc: 'Node 20+ and Express. Rate-limited per route. Warmed up by a frontend ping every 10 min.',
      tech: ['Node 20+', 'Express 4', 'Helmet', 'express-rate-limit', 'CORS allowlist'],
    },
    {
      id: 'render', label: 'Vercel Hosting', icon: '☁️', layer: 'infra',
      desc: 'Auto-deploys on push to main. Free-tier with health-check warmup.',
      tech: ['Vercel', 'Auto-deploy', 'HTTPS', 'Env secrets'],
    },
    {
      id: 'supa', label: 'Supabase Postgres', icon: '🗄️', layer: 'data',
      desc: 'Managed Postgres for blog comments, analytics and the contact inbox. Offline for now, so those features are switched off.',
      tech: ['Postgres', 'Row-level security', 'REST API'],
    },
    {
      id: 'trace', label: 'Agent trace', icon: '{ }', layer: 'data',
      desc: 'The lab replays three turns recorded from the live Planning Desk app: a static JSON file served with the site and played back in the browser with signals and SVG. No model or API is called.',
      tech: ['Static JSON', 'SVG', 'Signals', 'prefers-reduced-motion'],
    },
    {
      id: 'github', label: 'GitHub REST API', icon: '🐙', layer: 'data',
      desc: 'Live repo activity, language and star stats. Cached 1h in localStorage.',
      tech: ['REST v3', 'localStorage cache'],
    },
    {
      id: 'spotify', label: 'Spotify API', icon: '🎵', layer: 'data',
      desc: 'OAuth refresh-token flow proxied through backend to expose now-playing.',
      tech: ['OAuth 2.0', 'Refresh token', 'Backend proxy'],
    },
  ];

  // Sizes come from the production build (npx ng build --configuration=production),
  // budgets from angular.json, particle counts from three-scene.component.ts.
  readonly perfMetrics: PerfMetric[] = [
    { label: 'Initial bundle', value: '~350 kB', detail: 'About 102 kB estimated transfer', color: '#16a34a' },
    { label: 'Three.js chunk', value: '~512 kB', detail: 'About 108 kB transfer, lazy-loaded', color: '#16a34a' },
    { label: 'Initial budget', value: '500 kB', detail: 'Warns above it, fails the build at 1 MB', color: '#16a34a' },
    { label: 'Component style budget', value: '24 kB', detail: 'Warns above it, fails at 48 kB', color: '#16a34a' },
    { label: 'Hero particles', value: '1,500', detail: '600 on narrow or low-memory devices', color: '#6c63ff' },
  ];

  readonly perfTechniques = [
    { icon: '🔮', title: 'Route Preloading', desc: 'PreloadAllModules fetches every lazy chunk after initial nav, so subsequent route clicks are instant.' },
    { icon: '⚡', title: 'View Transitions API', desc: 'Native browser route morphs (Chrome/Edge). Falls back gracefully elsewhere.' },
    { icon: '🎯', title: 'IntersectionObserver @defer', desc: 'Three.js (about 108 kB transferred) only loads when the hero scrolls into view, prefetched on idle.' },
    { icon: '🔌', title: 'Preconnect Hints', desc: '<link rel="preconnect"> to the API and GitHub opens the connection before the first request needs it.' },
    { icon: '🌙', title: 'Tab-Hidden Pause', desc: 'WebGL animation + API polling pause when document.hidden — saves CPU + battery.' },
    { icon: '💾', title: 'Smart Caching', desc: 'GitHub responses cached 1h in localStorage. Service Worker for offline shell.' },
    { icon: '📱', title: 'Adaptive Quality', desc: 'The hero drops from 1,500 to 600 particles below 768 px wide or when deviceMemory is 4 or less.' },
    { icon: '🎨', title: 'CSS-Only Skeletons', desc: 'No JS needed for loading states — pure CSS keyframes on the GPU compositor.' },
  ];

  readonly cicdSteps: PipelineStep[] = [
    { step: 1, name: 'Push to main', cmd: 'git push origin main', desc: 'Starts the CI workflow on GitHub Actions. Vercel picks up the same push for the backend.' },
    { step: 2, name: 'Lint + Test', cmd: 'npm run lint && npx ng test', desc: 'ESLint, then the Karma unit tests in headless Chrome. The backend runs its node:test suite in a parallel job.' },
    { step: 3, name: 'Frontend Build', cmd: 'npx ng build --configuration=production', desc: 'AOT compile, tree-shake, minify, hash assets.' },
    { step: 4, name: 'Bundle Audit', cmd: 'Built-in size budgets', desc: 'Warns when the initial bundle passes 500 kB and fails the build at 1 MB. Component styles warn at 24 kB and fail at 48 kB.' },
    { step: 5, name: 'Deploy to GH Pages', cmd: 'actions/deploy-pages', desc: 'Runs only after lint, tests and build pass, and publishes the build to GitHub Pages.' },
    { step: 6, name: 'Backend Deploy', cmd: 'Vercel auto-deploy', desc: 'Vercel builds backend/ into one Express function and swaps it in with zero downtime.' },
    { step: 7, name: 'Health Check', cmd: 'GET /api/health', desc: 'Frontend pings backend on app load and every 10 minutes while the tab is visible, keeping the function warm for the Spotify widget.' },
  ];

  readonly seoSignals = [
    { icon: '📋', title: 'Schema.org Person', desc: 'JSON-LD structured data tells search engines exactly who I am: name, role, employer, skills.' },
    { icon: '🔗', title: 'Per-Route Meta Tags', desc: 'Title, description, canonical, OG, Twitter cards updated on every navigation via SeoService.' },
    { icon: '🖼️', title: 'OG Images (1200×630)', desc: 'Custom Open Graph image so LinkedIn / Twitter previews look polished.' },
    { icon: '📜', title: 'Robots.txt + Sitemap', desc: 'Explicit sitemap.xml with all routes; robots.txt allows full crawl.' },
    { icon: '🌍', title: 'Hreflang + Locale', desc: 'en_US locale declared. Ready for multi-locale expansion.' },
    { icon: '⚡', title: 'Core Web Vitals', desc: 'The Three.js hero is deferred and the web fonts load without blocking render.' },
    { icon: '🔍', title: 'Semantic HTML', desc: 'Proper <main>, <nav>, <article>, <section>, ARIA labels, skip-to-content links.' },
    { icon: '📱', title: 'Mobile-First Indexing', desc: 'Responsive design, readable text without zoom.' },
  ];

  readonly securityFeatures = [
    { icon: '🛡️', title: 'Helmet Headers', desc: 'CSP, X-Frame-Options, HSTS, X-Content-Type-Options on every backend response.' },
    { icon: '🚦', title: 'Rate Limiting', desc: 'Per-IP limits: 100 requests per 15 min overall, contact 5 per hour, blog comments 8 per 15 min, reactions 30 per minute.' },
    { icon: '🔐', title: 'Secret Management', desc: 'API keys never touch the client. Spotify calls are proxied through the backend.' },
    { icon: '🌐', title: 'CORS Allowlist', desc: 'Only nandanhegde1.github.io + localhost get CORS headers. Other origins get none, so the browser blocks the response.' },
    { icon: '🧹', title: 'Input Sanitisation', desc: 'Length caps on every field and regex email validation.' },
    { icon: '🔒', title: 'XSS Protection', desc: 'Angular auto-escapes templates. DomSanitizer used only when explicitly required.' },
    { icon: '🍪', title: 'Cookieless Analytics', desc: 'No tracking cookies. Anonymous page-view counts via localStorage + backend log.' },
    { icon: '✅', title: 'OWASP Top 10 Audit', desc: 'Reviewed against injection, broken auth, sensitive data, XSS, CSRF, SSRF, dependency CVEs.' },
  ];

  // Computed: nodes filtered by current tab visualisation
  readonly archByLayer = computed(() => {
    const layers: ArchNode['layer'][] = ['edge', 'frontend', 'backend', 'data', 'infra'];
    return layers.map((layer) => ({
      layer,
      label: this.layerLabel(layer),
      color: this.layerColor(layer),
      nodes: this.archNodes.filter((n) => n.layer === layer),
    }));
  });

  private layerLabel(l: ArchNode['layer']): string {
    return { edge: 'Edge', frontend: 'Frontend', backend: 'Backend', data: 'Data', infra: 'Infrastructure' }[l];
  }

  private layerColor(l: ArchNode['layer']): string {
    return { edge: '#06b6d4', frontend: '#6c63ff', backend: '#10b981', data: '#f59e0b', infra: '#8b5cf6' }[l];
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
    { id: 'trace',   x: 860, y: 230 },
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
    { from: 'spa',    to: 'trace'   },
    { from: 'spa',    to: 'github'  },
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
      id: 'lab',
      label: 'Opening the lab',
      description: 'The page fetches a recorded Planning Desk trace, a static JSON file, from the same CDN and replays it in the browser. The backend and the model are never called.',
      hops: ['user', 'cdn', 'spa', 'trace'],
      color: '#f59e0b',
    },
    {
      id: 'github',
      label: 'Live GitHub stats',
      description: 'Dashboard requests recent activity straight from the GitHub REST API. The result is cached for an hour.',
      hops: ['user', 'spa', 'github'],
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
