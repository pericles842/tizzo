import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { RoomPage } from './room-page';
import { RoomService } from './room.service';
import { ParticipantView } from './video-tile';

/** Pista de video real de 1920×1080 (así el <video> tiene tamaño propio, como con una cámara) */
function fakeCameraTrack(): MediaStreamTrack {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  canvas.getContext('2d')!.fillRect(0, 0, 1920, 1080);
  return canvas.captureStream(5).getVideoTracks()[0];
}

const person = (index: number, track: MediaStreamTrack): ParticipantView => ({
  id: `p${index}`,
  userId: `u${index}`,
  name: index === 0 ? 'Profe' : `Estudiante ${index}`,
  isLocal: index === 1,
  isOwner: index === 0,
  audioOn: true,
  videoOn: true,
  videoTrack: track,
  audioTrack: null,
  screenTrack: null
});

/** Dibuja la sala en llamada con N personas (sin Daily) para medir el diseño */
async function renderInCall(count: number) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [RoomPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      MessageService,
      { provide: RoomService, useValue: { status: () => new Promise(() => undefined), join: () => new Promise(() => undefined) } }
    ]
  }).compileComponents();
  const fixture = TestBed.createComponent(RoomPage);
  fixture.componentRef.setInput('courseUuid', 'curso');
  const page = fixture.componentInstance as unknown as { stage: { set(value: string): void }; participants: { set(value: ParticipantView[]): void } };
  page.stage.set('in-call');
  const track = fakeCameraTrack();
  page.participants.set(Array.from({ length: count }, (_, i) => person(i, track)));
  fixture.detectChanges();
  await fixture.whenStable();
  document.body.appendChild(fixture.nativeElement);
  // Se espera a que los videos conozcan su tamaño (como cuando llega la cámara)
  await new Promise((resolve) => setTimeout(resolve, 600));
  return fixture.nativeElement as HTMLElement;
}

describe('Sala: el diseño cabe en la pantalla', () => {
  for (const count of [1, 2, 4, 12]) {
    it(`con ${count} ${count === 1 ? 'persona' : 'personas'} los controles se ven sin hacer scroll en la página`, async () => {
      const el = await renderInCall(count);
      const nav = el.querySelector('nav[aria-label="Controles de la llamada"]') as HTMLElement;
      expect(nav).not.toBeNull();
      // Karma pone su propio encabezado arriba: se mide contra la propia sala, que debe medir lo que la pantalla (h-dvh)
      const root = el.querySelector('div') as HTMLElement;
      const main = el.querySelector('main') as HTMLElement;
      expect(root.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight + 1);
      expect(nav.getBoundingClientRect().bottom).toBeLessThanOrEqual(root.getBoundingClientRect().bottom + 1);
      expect(nav.getBoundingClientRect().height).toBeGreaterThan(20);
      // La página no se desplaza: lo que no cabe se desplaza dentro de la rejilla, no empuja los controles
      expect(main.scrollHeight).toBeLessThanOrEqual(main.clientHeight + 1);
      el.remove();
    });
  }

  it('con una sola persona su recuadro ocupa el espacio entre el encabezado y los controles', async () => {
    const el = await renderInCall(1);
    const tile = el.querySelector('app-video-tile') as HTMLElement;
    const nav = el.querySelector('nav[aria-label="Controles de la llamada"]') as HTMLElement;
    expect(tile.getBoundingClientRect().height).toBeGreaterThan(80);
    expect(tile.getBoundingClientRect().bottom).toBeLessThanOrEqual(nav.getBoundingClientRect().top);
    el.remove();
  });
});
