import { TestBed, discardPeriodicTasks, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { SpotifyWidgetComponent } from './spotify-widget.component';

// With no Spotify credentials the API answers { isPlaying: false, mock: true }.
// The widget used to show a fixed track as "Last Played" on every page for that.
describe('SpotifyWidgetComponent', () => {
  const url = `${environment.apiUrl}/api/spotify/now-playing`;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SpotifyWidgetComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('renders nothing and stops polling when the API reports mock data', fakeAsync(() => {
    const fixture = TestBed.createComponent(SpotifyWidgetComponent);
    fixture.detectChanges();
    http.expectOne(url).flush({ isPlaying: false, mock: true });
    flushMicrotasks();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.spotify-widget')).toBeNull();
    expect(el.textContent?.trim()).toBe('');

    tick(30_000);
    http.expectNone(url);
    fixture.destroy();
  }));

  it('shows a track the API reports as playing', fakeAsync(() => {
    const fixture = TestBed.createComponent(SpotifyWidgetComponent);
    fixture.detectChanges();
    http.expectOne(url).flush({ isPlaying: true, title: 'Song', artist: 'Artist', album: 'Album' });
    flushMicrotasks();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Now Playing');
    expect(text).toContain('Song');
    fixture.destroy();
    discardPeriodicTasks();
  }));
});
