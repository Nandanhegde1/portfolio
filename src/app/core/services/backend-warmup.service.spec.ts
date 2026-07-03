import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BackendWarmupService } from './backend-warmup.service';
import { environment } from '../../../environments/environment';

describe('BackendWarmupService', () => {
  let service: BackendWarmupService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BackendWarmupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('pings /api/health exactly once on init, and init is idempotent', () => {
    service.init();
    service.init(); // second call must not double-ping
    const reqs = httpMock.match(`${environment.apiUrl}/api/health`);
    expect(reqs.length).toBe(1);
    reqs[0].flush('ok');
  });

  it('survives a failing health endpoint without throwing', () => {
    service.init();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/health`);
    expect(() => req.flush('down', { status: 503, statusText: 'Service Unavailable' })).not.toThrow();
  });
});
