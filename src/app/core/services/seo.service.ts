import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

export interface SeoConfig {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
}

const SITE_NAME = 'Nandan Hegde';
const SITE_BASE = 'https://nandanhegde1.github.io/portfolio';
const DEFAULT_IMAGE = `${SITE_BASE}/assets/og-image.svg`;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Subscribe to router events and apply SEO from each route's data.seo. */
  init(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => this.collectSeoData(this.route)),
      )
      .subscribe(seo => this.update(seo ?? {}));
  }

  update(config: SeoConfig): void {
    const title = config.title
      ? `${config.title} | ${SITE_NAME}`
      : `${SITE_NAME} | Senior Software Engineer`;
    const description = config.description ?? 'Senior Software Engineer with 6+ years building enterprise Angular apps. AWS Certified.';
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
