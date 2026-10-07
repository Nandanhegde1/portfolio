import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AgentTraceFile } from '../models';

/**
 * Loads the recorded Planning Desk runs that /lab replays. The file is static
 * and lives with the site, so nothing here calls a model or the API.
 */
@Injectable({ providedIn: 'root' })
export class AgentTraceService {
  private readonly http = inject(HttpClient);

  readonly data = signal<AgentTraceFile | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /**
   * One request at a time: leaving /lab and coming back before the first
   * response would otherwise set data twice, and the second set swaps the
   * replay out from under a run that is already playing.
   */
  private inFlight = false;

  loadData(): void {
    if (this.data() || this.inFlight) return;
    this.inFlight = true;
    this.loading.set(true);
    this.error.set(null);
    this.http.get<AgentTraceFile>('assets/data/agent-traces.json').subscribe({
      next: (data) => {
        this.inFlight = false;
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.inFlight = false;
        this.error.set('The recorded runs could not be loaded.');
        this.loading.set(false);
      },
    });
  }
}
