import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FilePicker } from './file-picker';

describe('FilePicker', () => {
  function create(disabled = false) {
    TestBed.configureTestingModule({ imports: [FilePicker], providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(FilePicker);
    fixture.componentRef.setInput('label', 'Subir firma');
    fixture.componentRef.setInput('accept', 'image/png');
    fixture.componentRef.setInput('disabled', disabled);
    fixture.detectChanges();
    return fixture;
  }

  it('es un botón de PrimeNG con su etiqueta y un input de archivo accesible', () => {
    const el = create().nativeElement as HTMLElement;
    const label = el.querySelector('label')!;
    expect(label.classList.contains('p-button')).toBeTrue();
    expect(label.textContent).toContain('Subir firma');
    const input = el.querySelector('input')!;
    expect(input.type).toBe('file');
    expect(input.accept).toBe('image/png');
    expect(input.classList.contains('sr-only')).toBeTrue();
  });

  it('emite el archivo elegido y deja el input listo para elegir el mismo archivo otra vez', () => {
    const fixture = create();
    const picked: File[] = [];
    fixture.componentInstance.picked.subscribe((file) => picked.push(file));

    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    const file = new File(['x'], 'firma.png', { type: 'image/png' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));

    expect(picked).toEqual([file]);
    expect(input.value).toBe('');
  });

  it('no emite nada si se cancela el selector', () => {
    const fixture = create();
    let emitted = 0;
    fixture.componentInstance.picked.subscribe(() => emitted++);
    (fixture.nativeElement as HTMLElement).querySelector('input')!.dispatchEvent(new Event('change'));
    expect(emitted).toBe(0);
  });

  it('deshabilitado: el input queda deshabilitado', () => {
    expect(((create(true).nativeElement as HTMLElement).querySelector('input') as HTMLInputElement).disabled).toBeTrue();
  });
});
