import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User } from './auth.models';
import { credentialsInterceptor } from '../http/credentials.interceptor';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;

const user: User = {
  uuid: 'u-1',
  role: 'teacher',
  is_admin: false,
  status: 'active',
  email: 'profe@test.com',
  email_verified: false,
  first_name: 'Luis',
  last_name: 'Gómez',
  phone: null,
  country_code: 'VE',
  age: 30,
  timezone: 'America/Caracas',
  topics: [{ id: 2, name: 'Idiomas', slug: 'idiomas' }],
  avatar_url: null,
  teacher_profile: {
    uuid: 'tp-1',
    headline: 'Profe',
    bio: null,
    specialty: null,
    years_experience: 3,
    approval_status: 'pending',
    rejection_reason: null,
    rating_avg: 0,
    rating_count: 0
  }
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('ensureSession pregunta /auth/me una sola vez, con credenciales (cookie httpOnly)', async () => {
    const first = service.ensureSession();
    const second = service.ensureSession();

    const req = http.expectOne(`${api}/auth/me`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ user });
    await Promise.all([first, second]);

    expect(service.status()).toBe('authenticated');
    expect(service.user()?.uuid).toBe('u-1');
    expect(service.isPendingTeacher()).toBeTrue();
  });

  it('sin sesión (401) queda como anónimo', async () => {
    const pending = service.ensureSession();
    http.expectOne(`${api}/auth/me`).flush({ message: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });
    await pending;

    expect(service.status()).toBe('anonymous');
    expect(service.user()).toBeNull();
  });

  it('login guarda el usuario', async () => {
    const pending = service.login('profe@test.com', 'clave1234');
    const req = http.expectOne(`${api}/auth/login`);
    expect(req.request.body).toEqual({ email: 'profe@test.com', password: 'clave1234' });
    req.flush({ user });
    await pending;

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('logout limpia la sesión aunque el API falle', async () => {
    const login = service.login('profe@test.com', 'clave1234');
    http.expectOne(`${api}/auth/login`).flush({ user });
    await login;

    const logout = service.logout();
    http.expectOne(`${api}/auth/logout`).flush(null, { status: 500, statusText: 'Error' });
    await logout.catch(() => undefined);

    expect(service.status()).toBe('anonymous');
    expect(service.user()).toBeNull();
  });

  it('addCredential manda multipart con el archivo y los campos', async () => {
    const file = new File(['%PDF'], 'titulo.pdf', { type: 'application/pdf' });
    const pending = service.addCredential({ title: 'Licenciado', institution: 'UCV', issued_at: null, credential_number: 'A-1', file });

    const req = http.expectOne(`${api}/teacher/credentials`);
    const body = req.request.body as FormData;
    expect(body.get('title')).toBe('Licenciado');
    expect(body.get('credential_number')).toBe('A-1');
    expect(body.has('issued_at')).toBeFalse();
    expect(body.get('file')).toEqual(file);
    req.flush({ credential: {} }, { status: 201, statusText: 'Created' });
    await pending;
  });
});
