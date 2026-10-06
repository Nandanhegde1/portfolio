import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EngagementService } from './engagement.service';

// localStorage keeps every path a visitor ever opened, including sections the
// site has since hidden, so returning visitors saw "8 of 7 sections".
describe('EngagementService', () => {
  const KEY = 'portfolio_engagement_v1';

  function withStoredVisits(paths: string[]): EngagementService {
    localStorage.setItem(KEY, JSON.stringify(paths.map((path) => ({ path, visitedAt: 0, dwellMs: 0 }))));
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    return TestBed.inject(EngagementService);
  }

  afterEach(() => localStorage.removeItem(KEY));

  it('counts only visited paths that are scored sections', () => {
    const engagement = withStoredVisits(['/', '/about', '/retired-section', '/about/old-page']);
    expect(engagement.visitedCount()).toBe(2);
  });

  it('ignores unscored paths in the score as well', () => {
    const engagement = withStoredVisits(['/retired-section']);
    expect(engagement.visitedCount()).toBe(0);
    expect(engagement.score()).toBe(0);
  });
});
