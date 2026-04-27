import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PortfolioData } from '../models';

@Injectable({ providedIn: 'root' })
export class PortfolioDataService {
  private readonly http = inject(HttpClient);

  readonly data = signal<PortfolioData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  loadData(): void {
    this.loading.set(true);
    this.http.get<PortfolioData>('assets/data/portfolio.json').subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load portfolio data');
        this.loading.set(false);
      },
    });
  }
}
