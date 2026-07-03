import { TestBed } from '@angular/core/testing';
import { Title, Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SeoService } from './seo.service';

// Locks the recruiter-facing meta: route titles/descriptions/canonical drifted
// back to old positioning twice — this pins the fallback and the update path.
describe('SeoService', () => {
  let service: SeoService;
  let title: Title;
  let meta: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SeoService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);
  });

  it('applies the AI-product fallback positioning when a route has no seo data', () => {
    service.update({});
    expect(title.getTitle()).toBe('Nandan Hegde | Senior Full-Stack Engineer · AI Products');
    const desc = meta.getTag('name="description"')?.content ?? '';
    expect(desc).toContain('AI');
    expect(desc).not.toContain('enterprise Angular apps');
  });

  it('suffixes the site name onto route titles and mirrors og/twitter tags', () => {
    service.update({ title: 'Projects — Case Studies', description: 'd', url: 'https://nandanhegde1.github.io/portfolio/projects' });
    expect(title.getTitle()).toBe('Projects — Case Studies | Nandan Hegde');
    expect(meta.getTag('property="og:title"')?.content).toBe('Projects — Case Studies | Nandan Hegde');
    expect(meta.getTag('name="twitter:title"')?.content).toBe('Projects — Case Studies | Nandan Hegde');
    expect(meta.getTag('property="og:url"')?.content).toBe('https://nandanhegde1.github.io/portfolio/projects');
  });

  it('writes and updates the canonical link element', () => {
    service.update({ url: 'https://nandanhegde1.github.io/portfolio/about' });
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://nandanhegde1.github.io/portfolio/about');
    service.update({ url: 'https://nandanhegde1.github.io/portfolio/pitch' });
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://nandanhegde1.github.io/portfolio/pitch');
  });
});
