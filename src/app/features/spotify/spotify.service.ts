import { Injectable, signal } from '@angular/core';

export interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  readonly currentTrack = signal<SpotifyTrack | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private pollInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Start polling for now-playing data.
   * In production, this calls the backend proxy at /api/spotify/now-playing
   * which handles the OAuth token refresh.
   * For now, uses mock data.
   */
  startPolling(): void {
    this.fetchNowPlaying();
    this.pollInterval = setInterval(() => this.fetchNowPlaying(), 30000);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async fetchNowPlaying(): Promise<void> {
    this.loading.set(true);
    try {
      // TODO: Replace with actual backend call
      // const response = await fetch('/api/spotify/now-playing');
      // const data = await response.json();

      // Mock data for now
      this.currentTrack.set({
        name: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        albumArt: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
        isPlaying: true,
        progress: 45,
        duration: 200,
        url: 'https://open.spotify.com',
      });
    } catch {
      this.error.set('Could not fetch Spotify data');
      this.currentTrack.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
