import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SectionHeaderComponent, ProjectCardComponent } from '../../shared/components';
import { PortfolioDataService } from '../../core/services';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [SectionHeaderComponent, ProjectCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section projects">
      <div class="container">
        <app-section-header tag="// portfolio" title="Featured Projects" subtitle="Real-world applications I've built and contributed to" />

        @if (data.data(); as portfolio) {
          <div class="projects__grid">
            @for (project of portfolio.projects; track project.id) {
              <app-project-card [project]="project" />
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .projects__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.5rem;
    }
  `],
})
export class ProjectsComponent implements OnInit {
  readonly data = inject(PortfolioDataService);

  ngOnInit(): void {
    if (!this.data.data()) {
      this.data.loadData();
    }
  }
}
