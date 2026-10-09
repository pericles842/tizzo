import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { TizzoPreset } from './tizzo.preset';
import { PRIMENG_ES } from './core/i18n/primeng-es';
import { credentialsInterceptor } from './core/http/credentials.interceptor';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
    provideClientHydration(withEventReplay()),
    // withFetch: requerido para que HttpClient funcione bien con SSR
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    // En el navegador pregunta quién está conectado antes del primer render (en el servidor no hace nada)
    provideAppInitializer(() => inject(AuthService).ensureSession()),
    provideAnimationsAsync(),
    MessageService,
    providePrimeNG({
      ripple: false,
      translation: PRIMENG_ES,
      theme: {
        preset: TizzoPreset,
        options: {
          // Mismo selector que el custom-variant dark de src/tailwind.css
          darkModeSelector: '.app-dark',
          cssLayer: { name: 'primeng', order: 'theme, base, primeng, components, utilities' }
        }
      }
    })
  ]
};
