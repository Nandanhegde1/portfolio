const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'src', 'app', 'features', 'guestbook', 'guestbook.service.ts');

const content = `import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GuestbookEntry } from '../../core/models';
import { environment } from '../../../environments/environment';

interface BackendEntry {
  id: string;
  name: string;
  message: string;
  emoji?: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class GuestbookService {
  private readonly http = inject(HttpClient);
  private readonly API = \`\${environment.apiUrl}/api/guestbook\`;
  private readonly STORAGE_KEY = 'portfolio_guestbook_reactions';

  readonly entries = signal<GuestbookEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadEntries();
  }

  loadEntries(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<BackendEntry[]>(this.API).subscribe({
      next: (data) => {
        const reactions = this.loadReactions();
        this.entries.set(
          (data || []).map((e) => ({
            id: e.id,
            name: e.name,
            message: e.message,
            timestamp: new Date(e.created_at),
            reactions: reactions[e.id] || { '\u{1F44D}': 0, '\u{1F389}': 0, '\u{1F680}': 0, '\u2764\uFE0F': 0, '\u{1F4A1}': 0 },
          })),
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Backend offline. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  addEntry(name: string, message: string): void {
    const cleanName = this.sanitize(name).slice(0, 50);
    const cleanMsg = this.sanitize(message).slice(0, 500);

    const optimistic: GuestbookEntry = {
      id: \`optimistic-\${crypto.randomUUID()}\`,
      name: cleanName,
      message: cleanMsg,
      timestamp: new Date(),
      reactions: { '\u{1F44D}': 0, '\u{1F389}': 0, '\u{1F680}': 0, '\u2764\uFE0F': 0, '\u{1F4A1}': 0 },
    };
    this.entries.update((prev) => [optimistic, ...prev]);

    this.http
      .post<BackendEntry>(this.API, { name: cleanName, message: cleanMsg })
      .subscribe({
        next: (saved) => {
          this.entries.update((prev) =>
            prev.map((e) =>
              e.id === optimistic.id
                ? { ...e, id: saved.id, timestamp: new Date(saved.created_at) }
                : e,
            ),
          );
        },
        error: () => {
          this.error.set('Failed to save. Please try again.');
          this.entries.update((prev) => prev.filter((e) => e.id !== optimistic.id));
        },
      });
  }

  addReaction(entryId: string, emoji: string): void {
    this.entries.update((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, reactions: { ...e.reactions, [emoji]: (e.reactions[emoji] || 0) + 1 } }
          : e,
      ),
    );
    this.saveReactions();
  }

  private sanitize(input: string): string {
    return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').trim();
  }

  private loadReactions(): Record<string, GuestbookEntry['reactions']> {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  private saveReactions(): void {
    try {
      const map: Record<string, GuestbookEntry['reactions']> = {};
      for (const e of this.entries()) map[e.id] = e.reactions;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(map));
    } catch {
      /* quota exceeded */
    }
  }
}
`;

fs.writeFileSync(target, content);
console.log('Wrote', target);
