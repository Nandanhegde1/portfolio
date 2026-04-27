import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';
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

  readonly topRepos = computed(() =>
    this.repos()
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
  );

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
      catchError(err => {
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
      this.stats.set(cached);
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

    const contributionData = this.generateMockContributions();

    const result: GitHubStats = {
      totalRepos: repos.length,
      totalStars,
      totalForks,
      followers: this.user()?.followers ?? 0,
      topLanguages,
      contributionData,
    };

    this.stats.set(result);
    this.setCache(result);
  }

  // Mock contribution data until we set up the backend proxy for GraphQL
  private generateMockContributions(): ContributionDay[] {
    const days: ContributionDay[] = [];
    const now = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const count = Math.floor(Math.random() * 12);
      const level = count === 0 ? 0 : count <= 3 ? 1 : count <= 6 ? 2 : count <= 9 ? 3 : 4;
      days.push({
        date: date.toISOString().split('T')[0],
        count,
        level: level as 0 | 1 | 2 | 3 | 4,
      });
    }
    return days;
  }

  private getCached(): GitHubStats | null {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > this.CACHE_TTL) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  private setCache(data: GitHubStats): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
      // localStorage full or unavailable
    }
  }
}
