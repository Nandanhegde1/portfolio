import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Post {
  slug: string;
  title: string;
  dek: string;
  body: string;
  tag: 'Engineering' | 'Design' | 'Career' | 'Tooling' | 'Notes';
  readMin: number;
  date: string;
  pullQuote?: string;
  cover?: string;
  featured?: boolean;
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="journal">
      <header class="journal__masthead">
        <div class="journal__masthead-row">
          <span class="journal__masthead-issue">Vol. 01 &middot; Issue {{ currentIssue() }}</span>
          <span class="journal__masthead-date">{{ today }}</span>
        </div>
        <h1 class="journal__masthead-title">
          Field <em>Notes</em>
        </h1>
        <p class="journal__masthead-tagline">
          Long-form writing on Angular, performance, design systems, and the craft of shipping software.
        </p>
        <div class="journal__masthead-rule" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </header>

      <div class="journal__inner">
        @if (featured(); as f) {
          <a [routerLink]="[]" (click)="open(f.slug); $event.preventDefault()" class="journal__cover">
            <div class="journal__cover-art" aria-hidden="true">
              <span class="journal__cover-glyph">{{ f.cover }}</span>
              <span class="journal__cover-blob journal__cover-blob--a"></span>
              <span class="journal__cover-blob journal__cover-blob--b"></span>
              <span class="journal__cover-blob journal__cover-blob--c"></span>
              <span class="journal__cover-grain"></span>
            </div>
            <div class="journal__cover-content">
              <div class="journal__chips">
                <span class="journal__chip journal__chip--feature">Feature</span>
                <span class="journal__chip">{{ f.tag }}</span>
                <span class="journal__chip journal__chip--ghost">{{ f.readMin }} min read</span>
              </div>
              <h2 class="journal__cover-title">{{ f.title }}</h2>
              <p class="journal__cover-dek">{{ f.dek }}</p>
              <div class="journal__byline">
                <span class="journal__byline-avatar">NH</span>
                <div>
                  <strong>Nandan Hegde</strong>
                  <span>{{ formatDate(f.date) }}</span>
                </div>
              </div>
              @if (f.pullQuote) {
                <blockquote class="journal__cover-pull">
                  <span aria-hidden="true">&ldquo;</span>{{ f.pullQuote }}<span aria-hidden="true">&rdquo;</span>
                </blockquote>
              }
              <span class="journal__cover-cta">Read the feature &rarr;</span>
            </div>
          </a>
        }

        <div class="journal__body">
          <main class="journal__archive">
            <div class="journal__archive-head">
              <h3>In this issue</h3>
              <div class="journal__filters" role="tablist">
                <button
                  class="journal__filter"
                  [class.journal__filter--active]="filter() === 'all'"
                  (click)="filter.set('all')"
                  role="tab"
                >All</button>
                @for (t of tags; track t) {
                  <button
                    class="journal__filter"
                    [class.journal__filter--active]="filter() === t"
                    (click)="filter.set(t)"
                    role="tab"
                  >{{ t }}</button>
                }
              </div>
            </div>

            <ol class="journal__list">
              @for (p of visible(); track p.slug; let i = $index) {
                <li class="journal__entry" [class.journal__entry--open]="opened() === p.slug">
                  <button class="journal__entry-head" (click)="open(p.slug)" [attr.aria-expanded]="opened() === p.slug">
                    <span class="journal__entry-num">{{ pad(i + 1) }}</span>
                    <div class="journal__entry-meta">
                      <h4 class="journal__entry-title">{{ p.title }}</h4>
                      <p class="journal__entry-dek">{{ p.dek }}</p>
                      <div class="journal__entry-row">
                        <span class="journal__chip journal__chip--sm">{{ p.tag }}</span>
                        <span class="journal__entry-dot">&middot;</span>
                        <span>{{ p.readMin }} min</span>
                        <span class="journal__entry-dot">&middot;</span>
                        <time>{{ formatDate(p.date) }}</time>
                      </div>
                    </div>
                    <span class="journal__entry-toggle" aria-hidden="true">{{ opened() === p.slug ? '−' : '+' }}</span>
                  </button>
                  @if (opened() === p.slug) {
                    <div class="journal__entry-body">
                      <p>{{ p.body }}</p>
                      @if (p.pullQuote) {
                        <blockquote>{{ p.pullQuote }}</blockquote>
                      }
                      <div class="journal__entry-footer">
                        <span>Filed under <em>{{ p.tag }}</em></span>
                        <span>&mdash;</span>
                        <span>{{ p.readMin }} min read</span>
                      </div>
                    </div>
                  }
                </li>
              }
            </ol>
          </main>

          <aside class="journal__rail">
            <section class="journal__rail-card">
              <h5 class="journal__rail-title">About this notebook</h5>
              <p>
                Written in plain text, shipped as Angular components. No CMS, no markdown plugin —
                each post is a typed object so the build catches typos at compile time.
              </p>
              <p class="journal__rail-meta">
                <span>{{ posts.length }} posts</span>
                <span>&middot;</span>
                <span>{{ totalMinutes() }} min total</span>
              </p>
            </section>

            <section class="journal__rail-card journal__rail-card--accent">
              <h5 class="journal__rail-title">Categories</h5>
              <ul class="journal__rail-tags">
                @for (t of tagCounts(); track t.tag) {
                  <li>
                    <button (click)="filter.set(t.tag)">
                      <span>{{ t.tag }}</span>
                      <span class="journal__rail-tag-n">{{ t.count }}</span>
                    </button>
                  </li>
                }
              </ul>
            </section>

            <section class="journal__rail-card">
              <h5 class="journal__rail-title">Subscribe</h5>
              <p>RSS &amp; weekly digest are coming soon. For now, the best way to follow along:</p>
              <div class="journal__rail-links">
                <a href="https://github.com/Nandanhegde1" target="_blank" rel="noopener">GitHub &rarr;</a>
                <a href="https://www.linkedin.com/in/nandan-hegde-3a7370166/" target="_blank" rel="noopener">LinkedIn &rarr;</a>
                <a routerLink="/contact">Email me &rarr;</a>
              </div>
            </section>

            <section class="journal__rail-card journal__rail-card--colophon">
              <h5 class="journal__rail-title">Colophon</h5>
              <dl>
                <dt>Set in</dt>
                <dd>Space Grotesk &middot; Inter</dd>
                <dt>Built with</dt>
                <dd>Angular 19 &middot; SCSS</dd>
                <dt>Updated</dt>
                <dd>{{ today }}</dd>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </section>
  `,
  styleUrl: './blog.component.scss',
})
export class BlogComponent {
  readonly today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  readonly currentIssue = signal(1);
  readonly opened = signal<string | null>(null);
  readonly filter = signal<'all' | Post['tag']>('all');

  readonly tags: Post['tag'][] = ['Engineering', 'Design', 'Career', 'Tooling', 'Notes'];

  readonly posts: Post[] = [
    {
      slug: 'shipping-portfolio-without-a-cms',
      title: 'Shipping a portfolio without a CMS',
      dek: 'Why I picked typed Angular objects over Contentful, Sanity, or a markdown loader — and what I gave up.',
      body: 'I kept replacing the blog tooling: first markdown files in src/assets, then a headless CMS, then back to markdown. Eventually I noticed the pattern — I was avoiding writing by tweaking the writing tool. So I deleted all of it and made each post a TypeScript object. The build catches typos. Routing is automatic. There is no draft state, no preview server, no API key. The downside: no rich images yet. The upside: I shipped the page.',
      tag: 'Engineering',
      readMin: 4,
      date: '2026-04-22',
      pullQuote: 'Tooling is a procrastination strategy in disguise.',
      cover: '✍️',
      featured: true,
    },
    {
      slug: 'angular-19-signals-real-world',
      title: 'Six months with Angular 19 signals',
      dek: 'What I keep reaching for, what I still wrap in RxJS, and the one footgun I hit on every project.',
      body: 'Signals are the right default for component state. Computed signals are the right default for derived state. Effects are the wrong default for almost everything — they hide control flow and make tests brittle. The one footgun: forgetting that read-tracking only happens during execution. If you call a signal inside a setTimeout, the dependency is not registered.',
      tag: 'Engineering',
      readMin: 6,
      date: '2026-04-10',
      pullQuote: 'Effects are the wrong default for almost everything.',
      cover: '⚡',
    },
    {
      slug: 'design-tokens-without-a-design-team',
      title: 'Design tokens when you are the only designer',
      dek: 'Five themes, zero hardcoded colors, and a SCSS file that fits on one screen.',
      body: 'I treat design tokens like an API contract with my future self. Spacing is a 4 px ladder. Colors are CSS custom properties only. Themes are alternate :root scopes. The whole system fits in seven SCSS partials and never needs a Figma export.',
      tag: 'Design',
      readMin: 5,
      date: '2026-03-28',
      cover: '🎨',
    },
    {
      slug: 'lighthouse-100-on-github-pages',
      title: 'Lighthouse 100 on GitHub Pages',
      dek: 'No edge worker, no image CDN, no service worker tricks. Just defer, preconnect, and ruthless honesty about the critical path.',
      body: 'Three changes moved the score from 78 to 100: lazy-loading the Three.js scene with @defer on idle, preconnecting Google Fonts, and removing a 200 KB icon font I was using for three icons. The lesson is the same one every time — measure, then delete.',
      tag: 'Tooling',
      readMin: 3,
      date: '2026-03-15',
      pullQuote: 'Measure, then delete.',
      cover: '⚡',
    },
    {
      slug: 'recruiter-friendly-readmes',
      title: 'Writing READMEs recruiters actually finish',
      dek: 'A 90-second test for whether the top of your repo answers the only three questions a hiring manager asks.',
      body: 'A recruiter spends roughly the same time on your README as on your resume. They want to know what it does, what it is built with, and whether you can ship. Anything else belongs in a docs folder. I rewrote my pinned repos against this rule and interview replies doubled.',
      tag: 'Career',
      readMin: 4,
      date: '2026-02-28',
      cover: '📝',
    },
    {
      slug: 'small-tools-i-keep-rewriting',
      title: 'Small tools I keep rewriting',
      dek: 'A debounced input, a typed event bus, a date formatter. Why I write them fresh every project instead of installing a library.',
      body: 'There is a class of utility that is faster to write than to evaluate. A typed event bus is twenty lines. A debounce is six. The cost of adding a dependency — audit, version drift, bundle weight, type compatibility — is higher than the cost of writing it again. The line moves with project size, but for portfolios it sits very low.',
      tag: 'Notes',
      readMin: 3,
      date: '2026-02-10',
      cover: '🔧',
    },
    {
      slug: 'three-js-without-a-physics-engine',
      title: 'Three.js without a physics engine',
      dek: 'Building a 1,500-particle hero that responds to a mouse with nothing but linear interpolation.',
      body: 'Real physics is fun and overkill for a hero scene. Lerp the particle towards a target, decay the velocity, and call it a day. Total code: forty lines. Total bundle weight added: zero. Total visual difference from a physics-engine version: imperceptible.',
      tag: 'Engineering',
      readMin: 5,
      date: '2026-01-22',
      cover: '🌌',
    },
  ];

  readonly featured = computed(() => this.posts.find(p => p.featured));
  readonly nonFeatured = computed(() => this.posts.filter(p => !p.featured));
  readonly visible = computed(() => {
    const f = this.filter();
    const list = this.nonFeatured();
    return f === 'all' ? list : list.filter(p => p.tag === f);
  });
  readonly totalMinutes = computed(() => this.posts.reduce((s, p) => s + p.readMin, 0));
  readonly tagCounts = computed(() =>
    this.tags
      .map(tag => ({ tag, count: this.posts.filter(p => p.tag === tag).length }))
      .filter(t => t.count > 0)
  );

  open(slug: string): void {
    this.opened.set(this.opened() === slug ? null : slug);
  }

  pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
