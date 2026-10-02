import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/** Clave en localStorage. Debe coincidir con el script inline de src/index.html. */
export const THEME_STORAGE_KEY = 'tizzo-theme';

/** Clase que activa el tema oscuro; la comparten Tailwind (@custom-variant) y PrimeNG (darkModeSelector). */
export const DARK_CLASS = 'app-dark';

/**
 * Tema claro ("Lila nube") u oscuro ("Violeta noche").
 * El tema inicial lo aplica un script inline en index.html antes de pintar (sin parpadeo);
 * este servicio lo lee de ahí y se encarga de los cambios.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<Theme>(this.readInitialTheme());

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    if (!this.isBrowser) return;

    const root = this.document.documentElement;
    root.classList.toggle(DARK_CLASS, theme === 'dark');
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Navegación privada o almacenamiento bloqueado: el tema funciona igual, solo no se recuerda
    }
  }

  private readInitialTheme(): Theme {
    if (!this.isBrowser) return 'light';
    return this.document.documentElement.classList.contains(DARK_CLASS) ? 'dark' : 'light';
  }
}
