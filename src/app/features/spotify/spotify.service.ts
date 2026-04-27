import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

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

interface NowPlayingResponse {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  progress?: number;
  duration?: number;
  url?: string;
  mock?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/api/spotify/now-playing`;

  readonly currentTrack = signal<SpotifyTrack | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private pollInterval: ReturnType<typeof setInterval> | null = null;

  startPolling(): void {
    this.fetchNowPlaying();
    this.pollInterval = setInterval(() => this.fetchNowPlaying(), 30_000);
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
      const data = await firstValueFrom(this.http.get<NowPlayingResponse>(this.API));
      if (data?.isPlaying && data.title) {
        this.currentTrack.set({
          name: data.title,
          artist: data.artist || '',
          album: data.album || '',
          albumArt: data.albumArt || '',
          isPlaying: true,
          progress: data.progress || 0,
          duration: data.duration || 0,
          url: data.url || 'https://open.spotify.com',
        });
      } else if (data?.mock) {
        // backend not configured — use a single static fallback so the widget still renders
        this.currentTrack.set({
          name: 'Blinding Lights',
          artist: 'The Weeknd',
          album: 'After Hours',
          albumArt: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
          isPlaying: false,
          progress: 0,
          duration: 200_000,
          url: 'https://open.spotify.com',
        });
      } else {
        this.currentTrack.set(null);
      }
    } catch {
      this.error.set('Spotify offline');
      this.currentTrack.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
