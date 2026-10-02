import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DARK_CLASS, THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  const root = document.documentElement;

  function create(): ThemeService {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    return TestBed.inject(ThemeService);
  }

  afterEach(() => {
    root.classList.remove(DARK_CLASS);
    root.style.colorScheme = '';
    localStorage.removeItem(THEME_STORAGE_KEY);
  });

  it('toma el tema que aplicó el script de index.html (clase en <html>)', () => {
    root.classList.add(DARK_CLASS);
    expect(create().theme()).toBe('dark');
  });

  it('arranca en claro si <html> no tiene la clase oscura', () => {
    expect(create().theme()).toBe('light');
  });

  it('toggle alterna la clase, el color-scheme y lo recuerda en localStorage', () => {
    const service = create();

    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(root.classList.contains(DARK_CLASS)).toBeTrue();
    expect(root.style.colorScheme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    service.toggle();
    expect(service.theme()).toBe('light');
    expect(root.classList.contains(DARK_CLASS)).toBeFalse();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
