import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Roast {
  id: string;
  body: string;
  author_name: string | null;
  author_link: string | null;
  is_pinned: boolean;
  reply_body: string | null;
  reply_at: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class RoastMeBackService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/api/roasts`;

  readonly roasts = signal<Roast[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly count = computed(() => this.roasts().length);
  readonly replyCount = computed(() => this.roasts().filter((r) => r.reply_body).length);
  readonly avgReplyMinutes = computed(() => {
    const replied = this.roasts().filter((r) => r.reply_at);
    if (!replied.length) return null;
    const total = replied.reduce((sum, r) => {
      const t = new Date(r.reply_at!).getTime() - new Date(r.created_at).getTime();
      return sum + Math.max(0, t);
    }, 0);
    return Math.round(total / replied.length / 60_000);
  });

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<Roast[]>(this.API));
      this.roasts.set(data || []);
    } catch {
      this.error.set('Backend snoozing. Try again in a moment.');
    } finally {
      this.loading.set(false);
    }
  }

  async submit(body: string, author_name?: string, author_link?: string): Promise<Roast | null> {
    const linkRaw = author_link?.trim();
    // Only send the link if it actually looks like a URL; otherwise drop it silently.
    const looksLikeUrl = !!linkRaw && /^(https?:\/\/|www\.)/i.test(linkRaw);
    const payload = {
      body: body.trim(),
      author_name: author_name?.trim() || undefined,
      author_link: looksLikeUrl ? (linkRaw!.startsWith('http') ? linkRaw : `https://${linkRaw}`) : undefined,
    };
    try {
      const saved = await firstValueFrom(this.http.post<Roast>(this.API, payload));
      this.roasts.update((list) => [saved, ...list]);
      return saved;
    } catch (err: unknown) {
      const msg = (err as { error?: { error?: string } })?.error?.error || 'Could not post roast.';
      this.error.set(msg);
      return null;
    }
  }
}
