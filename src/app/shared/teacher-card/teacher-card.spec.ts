import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TeacherCard, TeacherCardData } from './teacher-card';

const teacher: TeacherCardData = {
  id: 't-1',
  name: 'Prof. Andrea M.',
  subjects: 'Matemáticas · Álgebra',
  rating: 4.9,
  classes: 120,
  price: 12,
  live: true
};

describe('TeacherCard', () => {
  function render(data: TeacherCardData): HTMLElement {
    TestBed.configureTestingModule({ imports: [TeacherCard], providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(TeacherCard);
    fixture.componentRef.setInput('teacher', data);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra iniciales sin el "Prof.", precio, calificación y botón de reserva', () => {
    const el = render(teacher);
    expect(el.querySelector('.p-avatar')?.textContent?.trim()).toBe('AM');
    expect(el.textContent).toContain('$12');
    expect(el.textContent).toContain('4.9 · 120 clases');
    expect(el.querySelector('button')?.getAttribute('aria-label')).toBe('Reservar clase con Prof. Andrea M.');
  });

  it('muestra el badge EN VIVO solo si el profe está en vivo', () => {
    expect(render(teacher).querySelector('p-badge')?.textContent).toContain('EN VIVO');
    TestBed.resetTestingModule();
    expect(render({ ...teacher, live: false }).querySelector('p-badge')).toBeNull();
  });
});
