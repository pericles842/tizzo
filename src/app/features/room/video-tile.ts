import { Component, ElementRef, computed, effect, input, output, viewChild } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { ButtonDirective } from 'primeng/button';
import { Tag } from 'primeng/tag';

/** Lo que la sala sabe de cada persona conectada (sale de los participantes de Daily) */
export interface ParticipantView {
  id: string;
  name: string;
  isLocal: boolean;
  /** Profe (dueño de la sala) */
  isOwner: boolean;
  audioOn: boolean;
  videoOn: boolean;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  screenTrack: MediaStreamTrack | null;
}

/**
 * Recuadro de una persona en la sala: su video (o sus iniciales si tiene la cámara apagada), nombre, si tiene el
 * micrófono apagado y, para el profe, el botón de silenciar. También reproduce su audio (salvo el propio).
 * Con `screen` muestra la pantalla que comparte en vez de la cámara.
 */
@Component({
  selector: 'app-video-tile',
  imports: [Avatar, ButtonDirective, Tag],
  template: `
    <div class="relative flex size-full items-center justify-center overflow-hidden rounded-2xl bg-tz-stage text-tz-on-stage">
      <video
        #video
        autoplay
        playsinline
        [muted]="true"
        class="size-full"
        [class.hidden]="!showVideo()"
        [class.object-cover]="!screen()"
        [class.object-contain]="screen()"
        [class.-scale-x-100]="participant().isLocal && !screen()"
      ></video>
      @if (!showVideo()) {
        <p-avatar [label]="initials()" shape="circle" size="xlarge" class="tz-bg-gradient font-display text-xl text-white" />
      }
      @if (!participant().isLocal && !screen()) {
        <audio #audio autoplay></audio>
      }

      <div class="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
        <span class="flex min-w-0 items-center gap-1.5 rounded-lg bg-tz-stage/70 px-2 py-1 text-xs font-medium">
          @if (!participant().audioOn && !screen()) {
            <i class="pi pi-volume-off text-[0.7rem]" aria-label="Micrófono apagado"></i>
          }
          <span class="truncate">{{ label() }}</span>
          @if (participant().isOwner && !screen()) {
            <p-tag value="Profe" severity="info" class="text-[0.625rem]" />
          }
        </span>
        @if (canMute() && participant().audioOn && !participant().isLocal && !screen()) {
          <button
            pButton
            type="button"
            icon="pi pi-volume-off"
            label="Silenciar"
            size="small"
            severity="danger"
            [rounded]="true"
            class="shrink-0"
            [attr.aria-label]="'Silenciar a ' + participant().name"
            (click)="mute.emit(participant().id)"
          ></button>
        }
      </div>
    </div>
  `,
  host: { class: 'block' }
})
export class VideoTile {
  readonly participant = input.required<ParticipantView>();
  /** Muestra la pantalla compartida en vez de la cámara */
  readonly screen = input(false);
  /** El profe puede silenciar a los demás */
  readonly canMute = input(false);
  readonly mute = output<string>();

  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private readonly audio = viewChild<ElementRef<HTMLAudioElement>>('audio');

  private readonly track = computed(() => (this.screen() ? this.participant().screenTrack : this.participant().videoOn ? this.participant().videoTrack : null));
  protected readonly showVideo = computed(() => !!this.track());
  protected readonly initials = computed(() =>
    this.participant()
      .name.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('')
  );
  protected readonly label = computed(() => {
    const { name, isLocal } = this.participant();
    if (this.screen()) return `Pantalla de ${isLocal ? 'ti' : name}`;
    return isLocal ? `${name} (tú)` : name;
  });

  constructor() {
    // Solo se cambia el srcObject si cambió la pista (así el video no parpadea en cada actualización)
    effect(() => setTrack(this.video()?.nativeElement, this.track()));
    effect(() => setTrack(this.audio()?.nativeElement, this.participant().audioOn ? this.participant().audioTrack : null));
  }
}

function setTrack(element: HTMLMediaElement | undefined, track: MediaStreamTrack | null): void {
  if (!element) return;
  const current = (element.srcObject as MediaStream | null)?.getTracks()[0] ?? null;
  if (current === track) return;
  element.srcObject = track ? new MediaStream([track]) : null;
  if (track) void element.play().catch(() => undefined);
}
