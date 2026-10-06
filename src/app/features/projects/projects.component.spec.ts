import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PortfolioDataService } from '../../core/services';
import { PortfolioData, Project } from '../../core/models';
import { ProjectsComponent } from './projects.component';
import portfolio from '../../../assets/data/portfolio.json';

function project(overrides: Partial<Project>): Project {
  return {
    id: 'p', title: 'P', client: '', description: '', highlights: [], technologies: [],
    imageUrl: '', liveUrl: '', githubUrl: '', featured: false, category: 'enterprise',
    ...overrides,
  };
}

// Metrics used to be pulled out of highlight text with a regex, which put
// "19 / MIGRATION WITH" (the Angular version) on the Compass card. They are now
// an explicit list per project, and a project without one shows none.
describe('ProjectsComponent', () => {
  function render(projects: Project[]): HTMLElement {
    TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [
        {
          provide: PortfolioDataService,
          useValue: { data: signal({ projects } as unknown as PortfolioData), loadData: () => undefined },
        },
      ],
    });
    const fixture = TestBed.createComponent(ProjectsComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the metrics a project lists', () => {
    const el = render([project({ id: 'a', metrics: [{ value: '92%', label: 'recall@8 (12/13)' }] })]);
    const metrics = el.querySelectorAll('#panel-a .reel__metric');
    expect(metrics.length).toBe(1);
    expect(metrics[0].querySelector('strong')?.textContent).toBe('92%');
    expect(metrics[0].querySelector('span')?.textContent).toBe('recall@8 (12/13)');
  });

  it('renders no metrics for a project without any, whatever its highlights contain', () => {
    const el = render([
      project({ id: 'b', highlights: ['AngularJS to Angular 19 migration with ~30% load time reduction'] }),
    ]);
    expect(el.querySelector('#panel-b .reel__metrics')).toBeNull();
  });

  it('only shows figures that the project text in portfolio.json states', () => {
    for (const p of (portfolio as unknown as PortfolioData).projects) {
      const text = [p.description, ...p.highlights].join(' ');
      for (const m of p.metrics ?? []) {
        expect(text).withContext(`${p.id}: ${m.value}`).toContain(m.value);
      }
    }
  });
});
