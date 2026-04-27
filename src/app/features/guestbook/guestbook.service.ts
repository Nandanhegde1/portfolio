import { Injectable, signal } from '@angular/core';
import { GuestbookEntry } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class GuestbookService {
  private readonly STORAGE_KEY = 'portfolio_guestbook';

  readonly entries = signal<GuestbookEntry[]>(this.loadFromStorage());
  readonly loading = signal(false);

  addEntry(name: string, message: string): void {
    const entry: GuestbookEntry = {
      id: crypto.randomUUID(),
      name: this.sanitize(name),
      message: this.sanitize(message),
      timestamp: new Date(),
      reactions: { '👍': 0, '🎉': 0, '🚀': 0, '❤️': 0, '💡': 0 },
    };

    this.entries.update(prev => [entry, ...prev]);
    this.saveToStorage();
  }

  addReaction(entryId: string, emoji: string): void {
    this.entries.update(prev =>
      prev.map(e =>
        e.id === entryId
          ? { ...e, reactions: { ...e.reactions, [emoji]: (e.reactions[emoji] || 0) + 1 } }
          : e
      )
    );
    this.saveToStorage();
  }

  private sanitize(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .trim()
      .slice(0, 500);
  }

  private loadFromStorage(): GuestbookEntry[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return this.getMockEntries();
      const entries = JSON.parse(data);
      // Clear stale mock data (entries with simple numeric IDs)
      if (entries.length && entries.every((e: GuestbookEntry) => /^\d+$/.test(e.id))) {
        localStorage.removeItem(this.STORAGE_KEY);
        return this.getMockEntries();
      }
      return entries;
    } catch {
      return this.getMockEntries();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries()));
    } catch { /* quota exceeded */ }
  }

  private getMockEntries(): GuestbookEntry[] {
    return [];
  }
}
