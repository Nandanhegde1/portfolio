import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { StatsService } from './stats.service';

export interface SeoConfig {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
}

const SITE_NAME = 'Nandan Hegde';
const SITE_BASE = 'https://nandanhegde1.github.io/portfolio';
const DEFAULT_IMAGE = `${SITE_BASE}/assets/og-image.png`;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly stats = inject(StatsService);

  /** Subscribe to router events and apply SEO from each route's data.seo. */
  init(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => ({ seo: this.collectSeoData(this.route), url: this.router.url })),
      )
      .subscribe(({ seo, url }) => {
        this.update(seo ?? {});
        this.stats.trackPageView(url || '/');
      });
  }

  update(config: SeoConfig): void {
    const title = config.title
      ? `${config.title} | ${SITE_NAME}`
      : `${SITE_NAME} | Senior Full-Stack Engineer · AI Products`;
    const description = config.description ?? 'I build full-stack products — and the AI inside them. AI voice-interview + fit-scoring on a 10,000-user platform. Angular, TypeScript, Node, LLMs.';
    const url = config.url ?? SITE_BASE;
    const image = config.image ?? DEFAULT_IMAGE;
    const type = config.type ?? 'website';

    this.titleService.setTitle(title);

    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:image', content: image });
    this.metaService.updateTag({ property: 'og:type', content: type });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: image });

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }

  private collectSeoData(route: ActivatedRoute): SeoConfig | null {
    let r: ActivatedRoute | null = route;
    while (r?.firstChild) r = r.firstChild;
    return (r?.snapshot.data?.['seo'] as SeoConfig) ?? null;
  }
}
