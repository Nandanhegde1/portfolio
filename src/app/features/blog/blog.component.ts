import { Component, ChangeDetectionStrategy, signal, computed, inject, HostListener, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BlogCommentsService, COMMENT_REACTIONS, CommentReaction } from './blog-comments.service';

interface Post {
  slug: string;
  title: string;
  dek: string;
  paragraphs: string[];
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
  imports: [RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (activePost(); as post) {
      <!-- ────────── READER MODE ────────── -->
      <div class="reader-progress" [style.width.%]="progress()"></div>

      <article class="reader">
        <header class="reader__bar">
          <button class="reader__back" (click)="closePost()" aria-label="Back to all notes">
            &larr; All notes
          </button>
          <span class="reader__bar-title">{{ post.title }}</span>
          <span class="reader__bar-pct">{{ progress() }}%</span>
        </header>

        <div class="reader__article">
          <div class="reader__eyebrow">
            <span class="reader__eyebrow-tag">{{ post.tag }}</span>
            <span>&middot;</span>
            <span>{{ formatDate(post.date) }}</span>
            <span>&middot;</span>
            <span>{{ post.readMin }} min read</span>
          </div>

          <h1 class="reader__title">{{ post.title }}</h1>
          <p class="reader__dek">{{ post.dek }}</p>

          <div class="reader__byline">
            <span class="reader__byline-avatar">NH</span>
            <div>
              <strong>Nandan Hegde</strong>
              <span>Senior Software Engineer &middot; Bangalore</span>
            </div>
          </div>

          <div class="reader__body">
            @for (para of post.paragraphs; track $index) {
              <p>{{ para }}</p>
            }
            @if (post.pullQuote) {
              <div class="reader__pull">{{ post.pullQuote }}</div>
            }
          </div>

          <div class="reader__footnote">
            <span>Filed under <em>{{ post.tag }}</em></span>
            <span>&middot;</span>
            <span>{{ post.readMin }} min read</span>
            <span>&middot;</span>
            <span>{{ formatDate(post.date) }}</span>
          </div>
        </div>

        <!-- ── COMMENTS ── -->
        <section class="comments" aria-label="Reader comments">
          <header class="comments__head">
            <h2 class="comments__title">
              Discussion
              <span class="comments__count">{{ comments.comments().length }}</span>
            </h2>
            <p class="comments__sub">
              Push back, ask a question, or leave a note. Markdown is off — keep it short and human.
            </p>
          </header>

          <form class="comments__form" (submit)="submitComment(post.slug); $event.preventDefault()">
            <div class="comments__form-row">
              <input
                class="comments__input"
                type="text"
                placeholder="Your name"
                maxlength="60"
                required
                [ngModel]="commentName()"
                (ngModelChange)="commentName.set($event)"
                name="name"
                autocomplete="name"
              />
              <span class="comments__hint">Stays on this device · 2-60 chars</span>
            </div>
            <textarea
              class="comments__textarea"
              placeholder="Share a thought…"
              maxlength="800"
              required
              rows="3"
              [ngModel]="commentBody()"
              (ngModelChange)="commentBody.set($event)"
              name="body"
            ></textarea>
            <div class="comments__form-foot">
              <span class="comments__counter">{{ commentBody().length }} / 800</span>
              @if (comments.error(); as e) {
                <span class="comments__error">{{ e }}</span>
              }
              <button
                type="submit"
                class="comments__submit"
                [disabled]="comments.posting() || commentBody().trim().length < 2 || commentName().trim().length < 2"
              >
                {{ comments.posting() ? 'Posting…' : 'Post comment' }}
              </button>
            </div>
          </form>

          @if (comments.loading()) {
            <p class="comments__empty">Loading discussion…</p>
          } @else if (comments.comments().length === 0) {
            <p class="comments__empty">No comments yet. Be the first to weigh in.</p>
          } @else {
            <ul class="comments__list">
              @for (c of comments.comments(); track c.id) {
                <li class="comments__item">
                  <div class="comments__item-head">
                    <span class="comments__avatar" [style.background]="avatarColor(c.name)">
                      {{ initials(c.name) }}
                    </span>
                    <div>
                      <strong class="comments__name">{{ c.name }}</strong>
                      <span class="comments__when">{{ timeAgo(c.created_at) }}</span>
                    </div>
                  </div>
                  <p class="comments__body">{{ c.body }}</p>
                  <div class="comments__reactions">
                    @for (r of reactionList; track r) {
                      <button
                        type="button"
                        class="comments__react"
                        [class.comments__react--active]="(c.reactions[r] || 0) > 0"
                        (click)="reactToComment(c.id, r)"
                        [attr.aria-label]="'React with ' + r"
                      >
                        <span>{{ r }}</span>
                        @if ((c.reactions[r] || 0) > 0) {
                          <span class="comments__react-count">{{ c.reactions[r] }}</span>
                        }
                      </button>
                    }
                  </div>
                </li>
              }
            </ul>
          }
        </section>

        <nav class="reader__pager" aria-label="Article navigation">
          @if (prevPost(); as p) {
            <button class="reader__pager-link" (click)="openPost(p.slug)">
              <span class="reader__pager-label">&larr; Previous</span>
              <span class="reader__pager-title">{{ p.title }}</span>
            </button>
          } @else {
            <span class="reader__pager-end">You're at the latest.</span>
          }
          @if (nextPost(); as n) {
            <button class="reader__pager-link reader__pager-link--next" (click)="openPost(n.slug)">
              <span class="reader__pager-label">Next &rarr;</span>
              <span class="reader__pager-title">{{ n.title }}</span>
            </button>
          } @else {
            <span class="reader__pager-end">That's the oldest one.</span>
          }
        </nav>
      </article>
    } @else {
      <!-- ────────── INDEX (browse) ────────── -->
      <section class="journal">
        <header class="journal__masthead">
          <div class="journal__masthead-row">
            <span>Vol. 01 &middot; Issue {{ currentIssue() }}</span>
            <span>{{ today }}</span>
          </div>
          <h1 class="journal__masthead-title">Field <em>Notes</em></h1>
          <p class="journal__masthead-tagline">
            Long-form writing on Angular, performance, design systems, and the craft of shipping software.
          </p>
        </header>

        <div class="journal__inner">
          @if (featured(); as f) {
            <a class="journal__cover" (click)="openPost(f.slug); $event.preventDefault()" href="#">
              <div class="journal__cover-art">
                <span class="journal__cover-glyph">{{ f.cover }}</span>
              </div>
              <div class="journal__cover-content">
                <div class="journal__chips">
                  <span class="journal__chip journal__chip--feature">Feature</span>
                  <span class="journal__chip">{{ f.tag }}</span>
                  <span class="journal__chip journal__chip--ghost">{{ f.readMin }} min read</span>
                </div>
                <h2 class="journal__cover-title">{{ f.title }}</h2>
                <p class="journal__cover-dek">{{ f.dek }}</p>
                <span class="journal__cover-cta">Read the feature &rarr;</span>
              </div>
            </a>
          }

          <div class="journal__body">
            <main>
              <div class="journal__archive-head">
                <h3>In this issue</h3>
                <div class="journal__filters" role="tablist">
                  <button class="journal__filter"
                    [class.journal__filter--active]="filter() === 'all'"
                    (click)="filter.set('all')">All</button>
                  @for (t of tags; track t) {
                    <button class="journal__filter"
                      [class.journal__filter--active]="filter() === t"
                      (click)="filter.set(t)">{{ t }}</button>
                  }
                </div>
              </div>

              <ol class="journal__list">
                @for (p of visible(); track p.slug; let i = $index) {
                  <li class="journal__entry">
                    <a class="journal__entry-link" (click)="openPost(p.slug); $event.preventDefault()" href="#">
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
                      <span class="journal__entry-arrow" aria-hidden="true">&rarr;</span>
                    </a>
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
            </aside>
          </div>
        </div>
      </section>
    }
  `,
  styleUrl: './blog.component.scss',
})
export class BlogComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  readonly comments = inject(BlogCommentsService);
  private readonly defaultTitle = 'Blog | Nandan Hegde';

  readonly reactionList = COMMENT_REACTIONS;
  readonly commentName = signal<string>('');
  readonly commentBody = signal<string>('');

  readonly today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  readonly currentIssue = signal(1);
  readonly filter = signal<'all' | Post['tag']>('all');
  readonly activeSlug = signal<string | null>(null);
  readonly progress = signal(0);

  readonly tags: Post['tag'][] = ['Engineering', 'Design', 'Career', 'Tooling', 'Notes'];

  readonly posts: Post[] = [
    {
      slug: 'shipping-portfolio-without-a-cms',
      title: 'Shipping a portfolio without a CMS',
      dek: 'Why I picked typed Angular objects over Contentful, Sanity, or a markdown loader — and what I gave up.',
      paragraphs: [
        'I have rebuilt this blog four times. First it was markdown files in src/assets, parsed at runtime. Then it was a headless CMS with a slick admin UI nobody but me would ever see. Then markdown again, this time with frontmatter and a custom Vite plugin. Then back to a CMS, because the markdown plugin broke whenever I upgraded Angular.',
        'After the fourth rewrite I noticed a pattern — every time I hit a stretch where I had nothing to write about, I would silently start replacing the writing tool. Tooling was a procrastination strategy in disguise. I was building infrastructure to avoid doing the work the infrastructure was meant to support.',
        'So I deleted all of it. Each post is now a TypeScript object. No CMS. No markdown loader. No frontmatter parser. The build catches typos. Routing is automatic. There is no draft state, no preview server, no API key in some forgotten env file. The whole "pipeline" fits in one file.',
        'The downsides are real. I cannot have rich images without committing PNGs. I cannot edit on mobile. I cannot share a draft URL. If I ever have a non-developer guest writer, this falls apart. But for a personal blog where the writer is me and the reader is recruiters, the tradeoffs are obviously correct — and I would not have noticed that without trying every other option first.',
        'The lesson I keep relearning is that the best tool is the one that gets out of the way. For my use case, that turned out to be no tool at all.',
      ],
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
      paragraphs: [
        'Signals are the right default for component state. Computed signals are the right default for derived state. Effects are the wrong default for almost everything else, and I have the bug reports to prove it.',
        'For component-local state — toggles, form values, loading flags, the active tab — signals are objectively cleaner than BehaviorSubject. There is no async pipe to remember, no subscription to manage, no manual change detection. You read the value, you set the value, the template re-renders.',
        'Computed signals are even better. Anywhere I previously had a getter that depended on multiple reactive values, computed() does the right thing automatically. The dependency tracking just works, and you can debug it by reading the function. No marble diagrams, no operator chains, no "why is this firing twice".',
        'I still wrap async streams in RxJS. HTTP calls, websockets, debounced search input — these are streams of events over time, and RxJS is the right tool. Signals are values; observables are streams. Keep them in their lanes and life is easy.',
        'The footgun I hit every single project: read-tracking only happens during execution. If you call a signal inside a setTimeout, queueMicrotask, or any deferred callback, the dependency is not registered. Your computed will not update. You will spend 20 minutes thinking the framework is broken.',
        'The fix is always the same — read the signal at the top of the function, before any async hop. Once you internalize that signals are tracked synchronously, the model becomes obvious. Until then, every project ships with at least one mysteriously-stale UI bug.',
      ],
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
      paragraphs: [
        'I treat design tokens like an API contract with my future self. The point of a token is not abstraction for its own sake — it is a promise that the next time I want to change all the secondary text from #6c7393 to something slightly warmer, I will be able to do it in one place.',
        'My system has three rules. Spacing is a 4 px ladder ($space-xs through $space-4xl). Colors are CSS custom properties only — never hex literals in component SCSS. Themes are alternate :root scopes that swap the custom property values, nothing more.',
        'That third rule is the unlock. Switching themes is just changing one HTML attribute. There is no JavaScript repaint loop, no class toggle on every component, no theme provider. The browser does the work the browser is good at: applying cascading styles.',
        'The whole system fits in seven SCSS partials. The total token count is under 40. There is no Figma export, no Style Dictionary build step, no token JSON. When I need a new color, I add it to _themes.scss in two places (light and dark) and I am done.',
        'This works because I am the only designer. The moment a second person joins, this stops scaling. But the lesson generalizes — start with the smallest system that works, and only add structure when something actually breaks.',
      ],
      tag: 'Design',
      readMin: 5,
      date: '2026-03-28',
      cover: '🎨',
    },
    {
      slug: 'lighthouse-100-on-github-pages',
      title: 'Lighthouse 100 on GitHub Pages',
      dek: 'No edge worker, no image CDN, no service worker tricks. Just defer, preconnect, and ruthless honesty about the critical path.',
      paragraphs: [
        'I started at a Lighthouse score of 78 and finished at 100, with no infrastructure changes. GitHub Pages is the same static host it was before. The bundle still gets built by Angular CLI. Nothing on the server side changed.',
        'Three changes did almost all the work. First, lazy-loading the Three.js scene with @defer (on idle). Three.js is 600 KB gzipped. Loading it before the user has even seen the page is malpractice. @defer pushes it to after first paint and the score jumped 11 points immediately.',
        'Second, preconnecting Google Fonts. The browser cannot start downloading the font until it has parsed the CSS that references it. A single <link rel="preconnect"> in the head opens the TCP connection in parallel with the HTML parse. Free 200 ms.',
        'Third, deleting a 200 KB icon font I was using for three icons. Three icons. I replaced them with inline SVGs and the bundle dropped by — you guessed it — almost exactly 200 KB. Lighthouse went from 91 to 100 on the same commit.',
        'The pattern, every single time: measure first, then delete. Not optimize. Delete. Optimization is fiddling with what you have. Deletion is admitting you did not need it.',
      ],
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
      paragraphs: [
        'A recruiter spends roughly the same amount of time on your README as on your resume — under 90 seconds, usually less. They are not going to scroll. They are not going to click into your /docs folder. Whatever the top of the README does not answer, you will not get credit for.',
        'There are exactly three questions a hiring manager has when they land on your repo. What does it do? What is it built with? Can you actually ship it? Anything that is not directly answering one of those three questions belongs in a /docs folder, in a CONTRIBUTING.md, or nowhere at all.',
        'I rewrote the top of my pinned repos against this rule. One sentence describing the product. One badge row showing the stack. One screenshot or GIF. One link that proves it works in production. Then — and only then — the technical detail, the install instructions, the architecture diagrams.',
        'The result was not subtle. Interview replies roughly doubled in the month after the rewrite. Same number of applications. Same resume. The only thing that changed was that recruiters could now answer their three questions in 30 seconds instead of giving up at 90.',
        'The same idea applies to the rest of your portfolio. Every page should answer "what is this and why should I care" above the fold. The day someone has to scroll to figure that out is the day you lose them.',
      ],
      tag: 'Career',
      readMin: 4,
      date: '2026-02-28',
      cover: '📝',
    },
    {
      slug: 'small-tools-i-keep-rewriting',
      title: 'Small tools I keep rewriting',
      dek: 'A debounced input, a typed event bus, a date formatter. Why I write them fresh every project instead of installing a library.',
      paragraphs: [
        'There is a class of utility that is faster to write than to evaluate. A typed event bus is twenty lines of TypeScript. A debounce function is six. A date formatter for the four formats I actually use is a switch statement. The cost of adding a dependency to handle these — security audit, version drift, bundle weight, type compatibility, learning the API — is higher than the cost of writing them.',
        'I keep a private gist with the canonical version of each one. When I start a new project, I paste them in and tweak. They take five minutes total. They have zero dependencies. They will still work in 2030.',
        'The line moves with project size. On a real product with a team, you want the well-tested library because the cost of a bug in your debounce is a customer incident. On a portfolio, the cost is "I notice and fix it in 30 seconds." The line sits very low when you are the only user.',
        'The deeper lesson is that "do not reinvent the wheel" is good advice for wheels and bad advice for everything that is not a wheel. Most utilities are not wheels. They are knobs you build for the exact dimensions of the door you are installing them on.',
      ],
      tag: 'Notes',
      readMin: 3,
      date: '2026-02-10',
      cover: '🔧',
    },
    {
      slug: 'three-js-without-a-physics-engine',
      title: 'Three.js without a physics engine',
      dek: 'Building a 1,500-particle hero that responds to a mouse with nothing but linear interpolation.',
      paragraphs: [
        'The hero on this site has 1,500 particles that drift, react to your mouse, and form patterns when you stop moving. There is no physics engine. There are no springs, no constraints, no integrators. The whole thing is forty lines of vanilla Three.js plus one math primitive: linear interpolation.',
        'For each particle I store a current position, a target position, and a velocity. Every frame, I move the position a small fraction of the way toward the target (that is the lerp). I decay the velocity by a constant factor. Mouse input nudges the target. That is the entire simulation.',
        'A real physics engine would add gravity, collisions, conservation of momentum. None of those things make a hero scene look better. They make it look more correct, which is not the same thing. For a decorative animation, "looks right" beats "is right" every time.',
        'The total bundle weight added by the simulation: zero. The total visual difference from a physics-engine version: imperceptible. The total cost in development time: an afternoon, including the time spent realizing I did not need cannon-es.',
        'The general lesson is the same one as the design tokens post — start with the smallest system that produces the result you want. Add complexity only when the result is wrong, not when the system is incomplete.',
      ],
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

  readonly activePost = computed<Post | null>(() => {
    const slug = this.activeSlug();
    if (!slug) return null;
    return this.posts.find(p => p.slug === slug) ?? null;
  });

  // Build a navigable order: feature first, then chronological list.
  readonly orderedPosts = computed<Post[]>(() => {
    const f = this.featured();
    return f ? [f, ...this.nonFeatured()] : this.posts;
  });

  readonly currentIndex = computed(() => {
    const slug = this.activeSlug();
    return slug ? this.orderedPosts().findIndex(p => p.slug === slug) : -1;
  });

  readonly prevPost = computed<Post | null>(() => {
    const i = this.currentIndex();
    return i > 0 ? this.orderedPosts()[i - 1] : null;
  });

  readonly nextPost = computed<Post | null>(() => {
    const i = this.currentIndex();
    const list = this.orderedPosts();
    return i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  });

  ngOnInit(): void {
    // Sync state with ?post=slug so reading mode is shareable + back-button works.
    this.route.queryParamMap.subscribe(params => {
      const slug = params.get('post');
      if (slug && this.posts.some(p => p.slug === slug)) {
        this.activeSlug.set(slug);
        this.title.setTitle(`${this.posts.find(p => p.slug === slug)!.title} | Nandan Hegde`);
        this.comments.loadFor(slug);
        this.commentName.set(this.comments.rememberedName());
        this.commentBody.set('');
        queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'auto' }));
      } else {
        this.activeSlug.set(null);
        this.title.setTitle(this.defaultTitle);
      }
      this.progress.set(0);
    });
  }

  ngOnDestroy(): void {
    this.title.setTitle(this.defaultTitle);
  }

  openPost(slug: string): void {
    this.router.navigate([], { queryParams: { post: slug }, queryParamsHandling: 'merge' });
  }

  closePost(): void {
    this.router.navigate([], { queryParams: { post: null }, queryParamsHandling: 'merge' });
  }

  // Track scroll progress only while a post is open so we can show the top bar.
  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.activeSlug()) return;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    if (scrollable <= 0) {
      this.progress.set(0);
      return;
    }
    const pct = Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));
    this.progress.set(pct);
  }

  // Esc closes reading mode — keyboard users get out fast.
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.activeSlug()) this.closePost();
  }

  pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Comments helpers ──
  submitComment(slug: string): void {
    this.comments.add(slug, this.commentName(), this.commentBody())
      .then(() => this.commentBody.set(''))
      .catch(() => { /* error already surfaced via service signal */ });
  }

  reactToComment(id: string, emoji: CommentReaction): void {
    this.comments.react(id, emoji);
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '?';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  // Stable hue per name — same person always gets the same avatar color.
  avatarColor(name: string): string {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const hue = h % 360;
    return `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 75% 45%))`;
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
