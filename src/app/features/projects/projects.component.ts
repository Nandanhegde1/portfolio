import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed, ElementRef, viewChildren, AfterViewInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PortfolioDataService } from '../../core/services';
import { Project } from '../../core/models';

type Category = Project['category'] | 'innovation';

interface CategoryMeta {
  key: Category | 'all';
  label: string;
  color: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="reel">
      <header class="reel__header">
        <div class="reel__header-left">
          <span class="reel__kicker">Selected Work &middot; 2020 — 2026</span>
          <h1 class="reel__title">
            Case <span class="reel__title-stroke">Studies</span>
          </h1>
          <p class="reel__lede">
            A reel of the projects I've shipped. Each one is its own panel — scroll to walk through the stack,
            the metrics, and the calls I made along the way.
          </p>
        </div>
        <div class="reel__header-right">
          <div class="reel__stat">
            <strong>{{ allProjects().length }}</strong>
            <span>Case studies</span>
          </div>
          <div class="reel__stat">
            <strong>{{ totalHighlights() }}</strong>
            <span>Wins shipped</span>
          </div>
          <div class="reel__stat">
            <strong>{{ uniqueTech() }}</strong>
            <span>Distinct tools</span>
          </div>
        </div>
      </header>

      <div class="reel__filterbar">
        @for (c of categoryMetas; track c.key) {
          <button
            class="reel__pill"
            [class.reel__pill--active]="filter() === c.key"
            [style.--pill-color]="c.color"
            (click)="filter.set(c.key)"
          >
            <span class="reel__pill-dot"></span>
            {{ c.label }}
            <span class="reel__pill-n">{{ countFor(c.key) }}</span>
          </button>
        }
      </div>

      <div class="reel__body">
        <aside class="reel__index">
          <div class="reel__index-head">Now showing</div>
          <ol class="reel__index-list">
            @for (p of visible(); track p.id; let i = $index) {
              <li
                class="reel__index-item"
                [class.reel__index-item--active]="activeIndex() === i"
                [style.--idx-color]="colorFor(p.category)"
              >
                <button (click)="scrollTo(p.id)">
                  <span class="reel__index-num">{{ pad(i + 1) }}</span>
                  <span class="reel__index-name">{{ p.title }}</span>
                  <span class="reel__index-bar"></span>
                </button>
              </li>
            }
          </ol>
          <div class="reel__index-foot">
            <span>{{ pad(activeIndex() + 1) }}</span>
            <span class="reel__index-foot-sep">/</span>
            <span>{{ pad(visible().length) }}</span>
          </div>
        </aside>

        <main class="reel__stage">
          @for (p of visible(); track p.id; let i = $index; let last = $last) {
            <article
              #panel
              class="reel__panel"
              [attr.id]="'panel-' + p.id"
              [style.--panel-color]="colorFor(p.category)"
            >
              <div class="reel__panel-chrome">
                <span class="reel__panel-num">{{ pad(i + 1) }}</span>
                <span class="reel__panel-divider"></span>
                <span class="reel__panel-cat">{{ labelFor(p.category) }}</span>
                @if (p.featured) {
                  <span class="reel__panel-feature">Featured</span>
                }
              </div>

              <div class="reel__panel-grid">
                <div class="reel__panel-main">
                  <h2 class="reel__panel-title">{{ p.title }}</h2>
                  <div class="reel__panel-client">
                    <span class="reel__client-mark"></span>
                    {{ p.client }}
                  </div>
                  <p class="reel__panel-desc">{{ p.description }}</p>

                  @if (metricsFor(p).length) {
                    <div class="reel__metrics">
                      @for (m of metricsFor(p); track m.label) {
                        <div class="reel__metric">
                          <strong>{{ m.value }}</strong>
                          <span>{{ m.label }}</span>
                        </div>
                      }
                    </div>
                  }

                  <h3 class="reel__panel-h3">What shipped</h3>
                  <ul class="reel__highlights">
                    @for (h of p.highlights; track h; let hi = $index) {
                      <li>
                        <span class="reel__h-num">{{ pad(hi + 1) }}</span>
                        <span class="reel__h-text">{{ h }}</span>
                      </li>
                    }
                  </ul>

                  @if (p.liveUrl || p.githubUrl) {
                    <div class="reel__actions">
                      @if (p.liveUrl) {
                        <a [href]="p.liveUrl" target="_blank" rel="noopener" class="reel__btn reel__btn--solid">
                          View live &rarr;
                        </a>
                      }
                      @if (p.githubUrl) {
                        <a [href]="p.githubUrl" target="_blank" rel="noopener" class="reel__btn reel__btn--ghost">
                          Source on GitHub
                        </a>
                      }
                    </div>
                  }
                </div>

                <aside class="reel__ribbon">
                  <div class="reel__ribbon-label">// stack</div>
                  <ul class="reel__ribbon-list">
                    @for (t of p.technologies; track t; let ti = $index) {
                      <li class="reel__ribbon-chip" [style.--delay]="(ti * 60) + 'ms'">
                        <span class="reel__ribbon-tick">▷</span>
                        {{ t }}
                      </li>
                    }
                  </ul>
                  <div class="reel__ribbon-foot">
                    {{ p.technologies.length }} tools &middot; {{ p.highlights.length }} wins
                  </div>
                </aside>
              </div>

              @if (!last) {
                <div class="reel__panel-end" aria-hidden="true">
                  <span></span><span>next case</span><span></span>
                </div>
              }
            </article>
          }

          @if (!visible().length) {
            <div class="reel__empty">
              <span>No projects in this category yet.</span>
              <button (click)="filter.set('all')">Show all &rarr;</button>
            </div>
          }
        </main>
      </div>
    </section>
  `,
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly data = inject(PortfolioDataService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly panels = viewChildren<ElementRef<HTMLElement>>('panel');

  readonly filter = signal<Category | 'all'>('all');
  readonly activeIndex = signal(0);

  private observer?: IntersectionObserver;

  readonly categoryMetas: CategoryMeta[] = [
    { key: 'all',         label: 'All',         color: '#6c63ff' },
    { key: 'enterprise',  label: 'Enterprise',  color: '#3b82f6' },
    { key: 'innovation',  label: 'Innovation',  color: '#a855f7' },
    { key: 'devops',      label: 'DevOps',      color: '#10b981' },
    { key: 'open-source', label: 'Open Source', color: '#f59e0b' },
    { key: 'personal',    label: 'Personal',    color: '#ec4899' },
  ];

  readonly allProjects = computed<Project[]>(() => this.data.data()?.projects ?? []);

  readonly visible = computed(() => {
    const f = this.filter();
    const all = this.allProjects();
    return f === 'all' ? all : all.filter(p => (p.category as Category) === f);
  });

  readonly totalHighlights = computed(() =>
    this.allProjects().reduce((s, p) => s + (p.highlights?.length ?? 0), 0)
  );

  readonly uniqueTech = computed(() => {
    const set = new Set<string>();
    for (const p of this.allProjects()) for (const t of p.technologies ?? []) set.add(t);
    return set.size;
  });

  ngOnInit(): void {
    if (!this.data.data()) this.data.loadData();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => this.attachObserver());
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private attachObserver(): void {
    this.observer?.disconnect();
    const els = this.panels().map(r => r.nativeElement);
    if (!els.length) return;
    this.observer = new IntersectionObserver((entries) => {
      let bestIdx = this.activeIndex();
      let bestRatio = 0;
      for (const e of entries) {
        if (e.intersectionRatio > bestRatio) {
          const idx = els.indexOf(e.target as HTMLElement);
          if (idx >= 0) { bestIdx = idx; bestRatio = e.intersectionRatio; }
        }
      }
      if (bestRatio > 0) this.activeIndex.set(bestIdx);
    }, { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
    els.forEach(el => this.observer!.observe(el));
  }

  countFor(key: Category | 'all'): number {
    if (key === 'all') return this.allProjects().length;
    return this.allProjects().filter(p => (p.category as Category) === key).length;
  }

  colorFor(cat: string): string {
    return this.categoryMetas.find(c => c.key === cat)?.color ?? '#6c63ff';
  }

  labelFor(cat: string): string {
    return this.categoryMetas.find(c => c.key === cat)?.label ?? cat;
  }

  pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }

  scrollTo(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.host.nativeElement.querySelector('#panel-' + id) as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  metricsFor(p: Project): { value: string; label: string }[] {
    const out: { value: string; label: string }[] = [];
    const re = /(\d[\d,]*\+?%?)\s+([a-z][a-z\s/]{2,30})/i;
    for (const h of p.highlights ?? []) {
      const m = h.match(re);
      if (m) {
        const value = m[1];
        let label = m[2].trim().split(/\s+/).slice(0, 3).join(' ');
        label = label.replace(/[.,;:]$/, '').toLowerCase();
        if (!out.find(x => x.value === value)) out.push({ value, label });
      }
      if (out.length >= 3) break;
    }
    return out;
  }
}
