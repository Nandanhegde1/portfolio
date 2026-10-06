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
  /** False once the API says Spotify is not configured; the widget then renders nothing. */
  readonly available = signal(true);
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
        // The API has no Spotify credentials, so there is nothing real to show,
        // and nothing will change until it does.
        this.currentTrack.set(null);
        this.available.set(false);
        this.stopPolling();
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
