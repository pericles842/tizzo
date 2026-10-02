import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TopicPicker } from './topic-picker';

describe('TopicPicker', () => {
  it('alterna temas, actualiza el contador y marca aria-pressed', async () => {
    TestBed.configureTestingModule({ imports: [TopicPicker], providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(TopicPicker);
    fixture.componentRef.setInput('topics', [
      { id: 1, name: 'Matemáticas' },
      { id: 2, name: 'Idiomas' }
    ]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const buttons = () => Array.from(el.querySelectorAll('button'));

    expect(el.querySelector('p')?.textContent).toContain('Ningún tema seleccionado');

    buttons()[0].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toEqual([1]);
    expect(el.querySelector('p')?.textContent).toContain('1 tema seleccionado');
    expect(buttons()[0].getAttribute('aria-pressed')).toBe('true');
    // Seleccionado = botón relleno (sin la variante outlined)
    expect(buttons()[0].classList.contains('p-button-outlined')).toBeFalse();
    expect(buttons()[1].classList.contains('p-button-outlined')).toBeTrue();

    buttons()[1].click();
    await fixture.whenStable();
    expect(el.querySelector('p')?.textContent).toContain('2 temas seleccionados');

    buttons()[0].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toEqual([2]);
  });
});
