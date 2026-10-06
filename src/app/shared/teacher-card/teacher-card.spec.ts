import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TeacherCard, TeacherCardData } from './teacher-card';

const teacher: TeacherCardData = {
  uuid: 't-1',
  name: 'Andrea Martínez',
  avatar_url: null,
  headline: 'Profesora de álgebra',
  subjects: ['Álgebra', 'Cálculo'],
  years_experience: 8,
  rating: 4.9,
  reviews_count: 120,
  upcoming_count: 3,
  from_price: 12,
  live: true,
  featured: false
};

describe('TeacherCard', () => {
  function render(data: TeacherCardData, removable = false): HTMLElement {
    TestBed.configureTestingModule({ imports: [TeacherCard], providers: [provideZonelessChangeDetection(), provideRouter([])] });
    const fixture = TestBed.createComponent(TeacherCard);
    fixture.componentRef.setInput('teacher', data);
    fixture.componentRef.setInput('removable', removable);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra iniciales, precio desde, calificación y "Ver perfil" (nunca "Reservar clase")', () => {
    const el = render(teacher);
    expect(el.querySelector('.p-avatar')?.textContent?.trim()).toBe('AM');
    expect(el.textContent).toContain('Prof. Andrea Martínez');
    expect(el.textContent).toContain('Álgebra · Cálculo');
    expect(el.textContent).toContain('$12');
    expect(el.textContent).toContain('4.9 · 120 reseñas');
    expect(el.textContent).toContain('3 clases y cursos por dar');
    const link = el.querySelector('a');
    expect(link?.textContent).toContain('Ver perfil');
    expect(link?.getAttribute('href')).toBe('/profes/t-1');
    expect(link?.getAttribute('aria-label')).toBe('Ver perfil de Andrea Martínez');
    expect(el.textContent).not.toContain('Reservar');
  });

  it('un profe nuevo sin clases lo dice y no muestra precio', () => {
    const el = render({ ...teacher, rating: null, reviews_count: 0, upcoming_count: 0, from_price: null, subjects: [] });
    expect(el.textContent).toContain('Profe nuevo');
    expect(el.textContent).toContain('Sin clases programadas');
    expect(el.textContent).toContain('Profesora de álgebra');
    expect(el.textContent).not.toContain('Desde');
  });

  it('muestra el badge EN VIVO solo si el profe está en vivo', () => {
    expect(render(teacher).querySelector('p-badge')?.textContent).toContain('EN VIVO');
    TestBed.resetTestingModule();
    expect(render({ ...teacher, live: false }).querySelector('p-badge')).toBeNull();
  });

  it('"Quitar de favoritos" solo aparece con removable', () => {
    expect(render(teacher).textContent).not.toContain('Quitar de favoritos');
    TestBed.resetTestingModule();
    expect(render(teacher, true).textContent).toContain('Quitar de favoritos');
  });
});
