import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { GitHubUser, GitHubRepo, GitHubStats, ContributionDay } from '../models';

@Injectable({ providedIn: 'root' })
export class GitHubService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE = 'https://api.github.com';
  private readonly CACHE_KEY = 'gh-stats-cache';
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  readonly user = signal<GitHubUser | null>(null);
  readonly repos = signal<GitHubRepo[]>([]);
  readonly stats = signal<GitHubStats | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Most recently updated repo — for "Currently working on" hero indicator
  readonly mostRecentRepo = computed(() => {
    const r = this.repos();
    if (!r.length) return null;
    return [...r].sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];
  });

  fetchUser(username: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<GitHubUser>(`${this.API_BASE}/users/${username}`).pipe(
      tap(user => this.user.set(user)),
      catchError(() => {
        this.error.set('Failed to fetch GitHub profile');
        return of(null);
      })
    ).subscribe(() => this.loading.set(false));
  }

  fetchRepos(username: string): void {
    this.http.get<GitHubRepo[]>(
      `${this.API_BASE}/users/${username}/repos?per_page=100&sort=updated`
    ).pipe(
      tap(repos => {
        this.repos.set(repos);
        this.computeStats(repos);
      }),
      catchError(() => {
        this.error.set('Failed to fetch repositories');
        return of([]);
      })
    ).subscribe();
  }

  fetchAll(username: string): void {
    const cached = this.getCached();
    if (cached) {
      // Hydrate ALL signals — restoring only stats left user/repos empty, which
      // blanked the hero "currently shipping" + dashboard repo widgets for any
      // returning visitor inside the cache TTL.
      this.user.set(cached.user);
      this.repos.set(cached.repos);
      this.stats.set(cached.stats);
      return;
    }
    this.fetchUser(username);
    this.fetchRepos(username);
  }

  private computeStats(repos: GitHubRepo[]): void {
    const langMap = new Map<string, number>();
    let totalStars = 0;
    let totalForks = 0;

    repos.forEach(repo => {
      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;
      if (repo.language) {
        langMap.set(repo.language, (langMap.get(repo.language) ?? 0) + 1);
      }
    });

    const topLanguages = Array.from(langMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Real contribution history needs an authenticated GitHub GraphQL call
    // via a backend proxy; until that exists we ship no graph rather than fake one.
    const contributionData: ContributionDay[] = [];

    const result: GitHubStats = {
      totalRepos: repos.length,
      totalStars,
      totalForks,
      followers: this.user()?.followers ?? 0,
      topLanguages,
      contributionData,
    };

    this.stats.set(result);
    this.setCache({ user: this.user(), repos, stats: result });
  }

  private getCached(): CachedBundle | null {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > this.CACHE_TTL) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }
      // Entries written by the old stats-only cache shape lack repos — treat as a miss.
      if (!data || !Array.isArray(data.repos)) return null;
      return data;
    } catch {
      return null;
    }
  }

  private setCache(data: CachedBundle): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
      // localStorage full or unavailable
    }
  }
}

interface CachedBundle {
  user: GitHubUser | null;
  repos: GitHubRepo[];
  stats: GitHubStats;
}
