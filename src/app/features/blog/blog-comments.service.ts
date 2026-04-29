import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface BlogComment {
  id: string;
  post_slug: string;
  name: string;
  body: string;
  reactions: Record<string, number>;
  created_at: string;
}

export const COMMENT_REACTIONS = ['👍', '❤️', '🔥', '🤔', '🎯'] as const;
export type CommentReaction = typeof COMMENT_REACTIONS[number];

@Injectable({ providedIn: 'root' })
export class BlogCommentsService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/api/blog/comments`;
  private readonly NAME_KEY = 'portfolio_comment_name';

  readonly comments = signal<BlogComment[]>([]);
  readonly loading = signal(false);
  readonly posting = signal(false);
  readonly error = signal<string | null>(null);

  loadFor(slug: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.comments.set([]);
    this.http
      .get<BlogComment[]>(this.API, { params: { slug } })
      .subscribe({
        next: (rows) => {
          this.comments.set(rows || []);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load comments.');
          this.loading.set(false);
        },
      });
  }

  add(slug: string, name: string, body: string): Promise<void> {
    const cleanName = name.trim().slice(0, 60);
    const cleanBody = body.trim().slice(0, 800);
    if (cleanName.length < 2 || cleanBody.length < 2) {
      this.error.set('Name and message must be at least 2 characters.');
      return Promise.reject();
    }

    this.posting.set(true);
    this.error.set(null);
    this.rememberName(cleanName);

    const optimistic: BlogComment = {
      id: `optimistic-${crypto.randomUUID()}`,
      post_slug: slug,
      name: cleanName,
      body: cleanBody,
      reactions: {},
      created_at: new Date().toISOString(),
    };
    this.comments.update((prev) => [optimistic, ...prev]);

    return new Promise((resolve, reject) => {
      this.http
        .post<BlogComment>(this.API, { slug, name: cleanName, body: cleanBody })
        .subscribe({
          next: (saved) => {
            this.comments.update((prev) =>
              prev.map((c) => (c.id === optimistic.id ? saved : c)),
            );
            this.posting.set(false);
            resolve();
          },
          error: (err) => {
            this.comments.update((prev) => prev.filter((c) => c.id !== optimistic.id));
            this.error.set(err?.error?.error || 'Could not post comment. Try again.');
            this.posting.set(false);
            reject();
          },
        });
    });
  }

  react(id: string, emoji: CommentReaction): void {
    // Optimistic bump
    this.comments.update((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, reactions: { ...c.reactions, [emoji]: (c.reactions[emoji] || 0) + 1 } }
          : c,
      ),
    );

    this.http
      .post<{ id: string; reactions: Record<string, number> }>(
        `${this.API}/${id}/react`,
        { emoji },
      )
      .subscribe({
        next: (res) => {
          this.comments.update((prev) =>
            prev.map((c) => (c.id === id ? { ...c, reactions: res.reactions } : c)),
          );
        },
        error: () => {
          // Roll back optimistic bump on failure.
          this.comments.update((prev) =>
            prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    reactions: {
                      ...c.reactions,
                      [emoji]: Math.max(0, (c.reactions[emoji] || 1) - 1),
                    },
                  }
                : c,
            ),
          );
        },
      });
  }

  rememberedName(): string {
    try { return localStorage.getItem(this.NAME_KEY) || ''; } catch { return ''; }
  }

  private rememberName(name: string): void {
    try { localStorage.setItem(this.NAME_KEY, name); } catch { /* ignore quota / disabled storage */ }
  }

  clearError(): void { this.error.set(null); }
}
