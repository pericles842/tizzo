import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChatMessage, RoomChat } from './room-chat';

const message = (id: number, name: string, text: string, mine = false): ChatMessage => ({ id, name, text, at: new Date(2026, 9, 9, 18, 5), mine });

async function render(messages: ChatMessage[]) {
  await TestBed.configureTestingModule({ imports: [RoomChat], providers: [provideZonelessChangeDetection()] }).compileComponents();
  const fixture = TestBed.createComponent(RoomChat);
  fixture.componentRef.setInput('messages', messages);
  const sent: string[] = [];
  fixture.componentInstance.send.subscribe((text) => sent.push(text));
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement, sent };
}

describe('RoomChat', () => {
  it('sin mensajes invita a escribir el primero', async () => {
    const { el } = await render([]);
    expect(el.textContent).toContain('Todavía no hay mensajes');
  });

  it('muestra quién escribió cada mensaje y "Tú" en los propios', async () => {
    const { el } = await render([message(1, 'Laura Pérez', 'Hola profe'), message(2, 'Yo', 'Buenas', true)]);
    const text = el.textContent ?? '';
    expect(text).toContain('Laura Pérez');
    expect(text).toContain('Hola profe');
    expect(text).toContain('Tú');
    expect(text).toContain('Buenas');
  });

  it('un mensaje con HTML se muestra como texto, no se interpreta', async () => {
    const { el } = await render([message(1, 'Ana', '<img src=x onerror=alert(1)><b>negrita</b>')]);
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('li b')).toBeNull();
    expect(el.textContent).toContain('<b>negrita</b>');
  });

  it('enviar emite el texto sin espacios sobrantes y limpia el campo; vacío no se envía', async () => {
    const { fixture, el, sent } = await render([]);
    const input = el.querySelector('input') as HTMLInputElement;
    const form = el.querySelector('form') as HTMLFormElement;

    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));
    expect(sent).toEqual([]);

    input.value = '  ¿Puede repetir el ejemplo?  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(sent).toEqual(['¿Puede repetir el ejemplo?']);
    expect(input.value).toBe('');
  });

  it('el mensaje admite hasta 500 caracteres', async () => {
    const { el } = await render([]);
    expect((el.querySelector('input') as HTMLInputElement).maxLength).toBe(500);
  });
});
