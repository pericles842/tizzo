import { Component, DestroyRef, OnInit, PLATFORM_ID, computed, inject, input, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastService } from '../../core/notify/toast.service';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import type { DailyCall, DailyParticipant } from '@daily-co/daily-js';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Tooltip } from 'primeng/tooltip';
import { apiErrorMessage } from '../../core/http/api-error';
import { sessionPhase } from '../../core/live/session-phase';
import { Logo } from '../../shared/logo/logo';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';
import { RoomJoin, RoomService, RoomSession, RoomStatus } from './room.service';
import { ParticipantView, VideoTile } from './video-tile';

type Stage = 'loading' | 'closed' | 'lobby' | 'joining' | 'in-call' | 'left' | 'ejected' | 'ended' | 'error';

/** Cada cuánto se revisa si la sala abrió (pantalla de sala cerrada) */
const STATUS_POLL_MS = 30_000;

function toView(participant: DailyParticipant): ParticipantView {
  const { tracks } = participant;
  const playable = (state: string | undefined) => state === 'playable' || state === 'loading' || state === 'sendable';
  return {
    id: participant.session_id,
    userId: participant.user_id || null,
    name: participant.user_name || 'Invitado',
    isLocal: participant.local,
    isOwner: participant.owner,
    audioOn: playable(tracks.audio.state),
    videoOn: playable(tracks.video.state),
    videoTrack: tracks.video.persistentTrack ?? null,
    audioTrack: tracks.audio.persistentTrack ?? null,
    screenTrack: tracks.screenVideo.state === 'playable' ? (tracks.screenVideo.persistentTrack ?? null) : null
  };
}

/**
 * Sala de la videollamada de una clase suelta o curso (/sala/<uuid del curso>), con la interfaz de Tizzo
 * (Daily en modo "call object": Daily solo transporta audio y video, la pantalla es nuestra).
 *
 * 1. Pregunta al API el estado: si no hay clase abierta muestra cuándo es la próxima y vuelve a mirar cada 30 s.
 * 2. Con la sala abierta, "Entrar" pide al API un token SOLO para esa clase (valida acceso y horario) y se une.
 * 3. Todos entran con la cámara y el micrófono encendidos; el profe es dueño y puede silenciar a los demás.
 * 4. Al terminar la clase Daily saca a todos (el token vence) y se muestra "La clase terminó".
 */
@Component({
  selector: 'app-room-page',
  imports: [RouterLink, ButtonDirective, Card, Message, ProgressSpinner, Tooltip, Logo, ThemeToggle, VideoTile, ConfirmDialog],
  providers: [ConfirmationService],
  template: `
    <div class="flex min-h-dvh flex-col bg-tz-canvas">
      <header class="flex h-16 shrink-0 items-center gap-3 border-b border-tz-line bg-tz-header px-4 backdrop-blur-md sm:px-6">
        <a routerLink="/app" class="tz-focus rounded-lg" aria-label="Ir al panel"><app-logo /></a>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-tz-title sm:text-base">{{ heading() }}</p>
          @if (subheading(); as text) {
            <p class="truncate text-xs">{{ text }}</p>
          }
        </div>
        @if (stage() === 'in-call') {
          @if (isLive()) {
            <span class="tz-on-air-tag"><span class="tz-on-air-dot" aria-hidden="true"></span>EN VIVO</span>
          }
          <span class="hidden text-xs sm:inline" aria-live="off">{{ remaining() }}</span>
        }
        <app-theme-toggle />
      </header>

      <main id="contenido" class="flex flex-1 flex-col">
        @switch (stage()) {
          @case ('loading') {
            <div class="flex flex-1 items-center justify-center"><p-progress-spinner ariaLabel="Cargando la sala" /></div>
          }
          @case ('error') {
            <div class="flex flex-1 items-center justify-center p-4">
              <p-card class="w-full max-w-md border border-tz-surface-border">
                <p-message severity="error" role="alert">{{ error() }}</p-message>
                <a pButton routerLink="/app/calendario" label="Ir a mi calendario" icon="pi pi-calendar" class="mt-4 w-full"></a>
              </p-card>
            </div>
          }
          @case ('closed') {
            <div class="flex flex-1 items-center justify-center p-4">
              <p-card class="w-full max-w-md border border-tz-surface-border text-center">
                <i class="pi pi-clock text-3xl text-tz-subtitle" aria-hidden="true"></i>
                <h1 class="mt-3 text-xl font-semibold">La sala está cerrada</h1>
                @if (status()?.next_session; as next) {
                  <p class="mt-2 text-sm">La próxima clase es el <strong class="text-tz-title">{{ dateLabel(next.starts_at) }}</strong>.</p>
                  <p class="mt-1 text-sm">La sala abre {{ status()?.join_early_min }} minutos antes. Esta página se actualiza sola.</p>
                } @else {
                  <p class="mt-2 text-sm">Ya no quedan clases programadas.</p>
                }
                <a pButton routerLink="/app/calendario" label="Volver a mi calendario" icon="pi pi-calendar" severity="secondary" [outlined]="true" class="mt-5"></a>
              </p-card>
            </div>
          }
          @case ('lobby') {
            <div class="flex flex-1 items-center justify-center p-4">
              <p-card class="w-full max-w-md border border-tz-surface-border text-center">
                @if (openIsLive()) {
                  <span class="tz-on-air-tag"><span class="tz-on-air-dot" aria-hidden="true"></span>EN VIVO</span>
                } @else {
                  <p class="text-sm font-medium text-tz-subtitle">La sala ya abrió</p>
                }
                <h1 class="mt-3 text-xl font-semibold">{{ status()?.open_session?.title }}</h1>
                @if (status()?.open_session; as open) {
                  <p class="mt-1 text-sm">{{ timeRange(open) }}</p>
                }
                <p class="mt-4 text-sm">
                  Entrarás con tu cámara y tu micrófono encendidos; puedes apagarlos dentro.
                </p>
                @if (error(); as message) {
                  <p-message severity="error" styleClass="mt-4" role="alert">{{ message }}</p-message>
                }
                <button pButton type="button" label="Entrar a la clase" icon="pi pi-video" class="mt-5 w-full" (click)="join()"></button>
                <a pButton routerLink="/app/calendario" label="Volver" severity="secondary" [text]="true" class="mt-2"></a>
              </p-card>
            </div>
          }
          @case ('joining') {
            <div class="flex flex-1 flex-col items-center justify-center gap-3"><p-progress-spinner ariaLabel="Entrando a la clase" /><p class="text-sm">Entrando a la clase…</p></div>
          }
          @case ('in-call') {
            <div class="flex flex-1 flex-col gap-3 p-3 sm:p-4">
              @if (notice(); as message) {
                <p-message severity="warn" role="alert" [closable]="true" (onClose)="notice.set(null)">{{ message }}</p-message>
              }

              @if (sharer(); as presenter) {
                <!-- Alguien comparte pantalla: la pantalla grande y las personas en una franja -->
                <div class="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
                  <app-video-tile class="min-h-64" [participant]="presenter" [screen]="true" />
                  <div class="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-y-auto">
                    @for (person of participants(); track person.id) {
                      <app-video-tile class="aspect-video w-48 shrink-0 lg:w-full" [participant]="person" [canMute]="isTeacher()" (mute)="mute($event)" (eject)="askEject($event)" />
                    }
                  </div>
                </div>
              } @else {
                <div class="grid flex-1 auto-rows-fr gap-3" [style.grid-template-columns]="gridColumns()">
                  @for (person of participants(); track person.id) {
                    <app-video-tile class="min-h-40" [participant]="person" [canMute]="isTeacher()" (mute)="mute($event)" (eject)="askEject($event)" />
                  }
                </div>
              }

              <!-- Controles -->
              <nav class="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-tz-line bg-tz-surface p-2" aria-label="Controles de la llamada">
                @if (localAudio()) {
                  <button pButton type="button" icon="pi pi-microphone" severity="secondary" [rounded]="true" pTooltip="Apagar micrófono" tooltipPosition="top" aria-label="Apagar micrófono" (click)="toggleAudio()"></button>
                } @else {
                  <button pButton type="button" icon="pi pi-volume-off" severity="danger" [rounded]="true" pTooltip="Encender micrófono" tooltipPosition="top" aria-label="Encender micrófono" (click)="toggleAudio()"></button>
                }
                @if (localVideo()) {
                  <button pButton type="button" icon="pi pi-video" severity="secondary" [rounded]="true" pTooltip="Apagar cámara" tooltipPosition="top" aria-label="Apagar cámara" (click)="toggleVideo()"></button>
                } @else {
                  <button pButton type="button" icon="pi pi-eye-slash" severity="danger" [rounded]="true" pTooltip="Encender cámara" tooltipPosition="top" aria-label="Encender cámara" (click)="toggleVideo()"></button>
                }
                @if (screenSupported()) {
                  @if (localScreen()) {
                    <button pButton type="button" icon="pi pi-stop-circle" label="Dejar de compartir" severity="warn" [rounded]="true" (click)="toggleScreen()"></button>
                  } @else {
                    <button pButton type="button" icon="pi pi-desktop" severity="secondary" [rounded]="true" pTooltip="Compartir pantalla" tooltipPosition="top" aria-label="Compartir pantalla" (click)="toggleScreen()"></button>
                  }
                }
                <span class="mx-1 flex items-center gap-1.5 text-sm" aria-live="polite"><i class="pi pi-users" aria-hidden="true"></i>{{ participants().length }}</span>
                <button pButton type="button" icon="pi pi-sign-out" label="Salir" severity="danger" [rounded]="true" (click)="leave()"></button>
              </nav>
            </div>
          }
          @case ('left') {
            <div class="flex flex-1 items-center justify-center p-4">
              <p-card class="w-full max-w-md border border-tz-surface-border text-center">
                <h1 class="text-xl font-semibold">Saliste de la clase</h1>
                <p class="mt-2 text-sm">Puedes volver a entrar mientras la clase siga abierta.</p>
                <div class="mt-5 flex flex-wrap justify-center gap-2">
                  <button pButton type="button" label="Volver a entrar" icon="pi pi-video" (click)="reload()"></button>
                  <a pButton routerLink="/app/calendario" label="Ir a mi calendario" severity="secondary" [outlined]="true"></a>
                </div>
              </p-card>
            </div>
          }
          @case ('ejected') {
            <div class="flex flex-1 items-center justify-center p-4">
              <p-card class="w-full max-w-md border border-tz-surface-border text-center">
                <i class="pi pi-ban text-3xl text-tz-subtitle" aria-hidden="true"></i>
                <h1 class="mt-3 text-xl font-semibold">El profe te sacó de esta clase</h1>
                <p class="mt-2 text-sm">No puedes volver a entrar a esta clase. Podrás entrar a la siguiente con normalidad.</p>
                <a pButton routerLink="/app/calendario" label="Ir a mi calendario" icon="pi pi-calendar" class="mt-5"></a>
              </p-card>
            </div>
          }
          @case ('ended') {
            <div class="flex flex-1 items-center justify-center p-4">
              <p-card class="w-full max-w-md border border-tz-surface-border text-center">
                <i class="pi pi-check-circle text-3xl text-tz-subtitle" aria-hidden="true"></i>
                <h1 class="mt-3 text-xl font-semibold">La clase terminó</h1>
                <p class="mt-2 text-sm">La sala se cerró al llegar la hora de fin.</p>
                <a pButton routerLink="/app/calendario" label="Ir a mi calendario" icon="pi pi-calendar" class="mt-5"></a>
              </p-card>
            </div>
          }
        }
      </main>
    </div>
    <p-confirmdialog rejectButtonStyleClass="p-button-text p-button-secondary" />
  `
})
export class RoomPage implements OnInit {
  private readonly service = inject(RoomService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirmation = inject(ConfirmationService);
  private readonly toast = inject(ToastService);

  /** Viene de la ruta (withComponentInputBinding) */
  readonly courseUuid = input.required<string>();

  protected readonly stage = signal<Stage>('loading');
  protected readonly status = signal<RoomStatus | null>(null);
  protected readonly joined = signal<RoomJoin | null>(null);
  protected readonly participants = signal<ParticipantView[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly localAudio = signal(false);
  protected readonly localVideo = signal(false);
  protected readonly localScreen = signal(false);
  private readonly now = signal(new Date());

  private call: DailyCall | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly isTeacher = computed(() => (this.joined()?.role ?? this.status()?.role) === 'teacher');
  protected readonly heading = computed(() => this.joined()?.course.title ?? this.status()?.course.title ?? 'Sala de clase');
  protected readonly subheading = computed(() => {
    const course = this.joined()?.course ?? this.status()?.course;
    const session = this.joined()?.session ?? this.status()?.open_session;
    if (!course || !session || course.kind !== 'course') return null;
    return `Clase ${session.number} de ${course.total_sessions}: ${session.title}`;
  });
  protected readonly isLive = computed(() => {
    const session = this.joined()?.session;
    return !!session && sessionPhase(session.starts_at, session.ends_at, this.now()) === 'live';
  });
  protected readonly openIsLive = computed(() => {
    const session = this.status()?.open_session;
    return !!session && sessionPhase(session.starts_at, session.ends_at, this.now()) === 'live';
  });
  protected readonly remaining = computed(() => {
    const session = this.joined()?.session;
    if (!session) return '';
    const minutes = Math.ceil((new Date(session.ends_at).getTime() - this.now().getTime()) / 60_000);
    if (new Date(session.starts_at) > this.now()) return `Empieza a las ${this.time(session.starts_at)}`;
    return minutes > 0 ? `Quedan ${minutes} min` : 'Terminando';
  });
  /** Quien comparte pantalla (se muestra en grande) */
  protected readonly sharer = computed(() => this.participants().find((person) => !!person.screenTrack) ?? null);
  protected readonly gridColumns = computed(() => {
    const count = Math.max(1, this.participants().length);
    const columns = count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
    return `repeat(${columns}, minmax(0, 1fr))`;
  });
  protected readonly screenSupported = signal(false);

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.screenSupported.set(!!navigator.mediaDevices?.getDisplayMedia);
    const clock = setInterval(() => this.now.set(new Date()), 20_000);
    this.destroyRef.onDestroy(() => {
      clearInterval(clock);
      this.stopPolling();
      void this.destroyCall();
    });
    void this.loadStatus();
  }

  // ---------- Estado de la sala ----------

  private async loadStatus(): Promise<void> {
    try {
      const status = await this.service.status(this.courseUuid());
      this.status.set(status);
      if (status.open_session && status.ejected) {
        this.stopPolling();
        this.stage.set('ejected');
      } else if (status.open_session) {
        this.stopPolling();
        this.stage.set('lobby');
      } else {
        this.stage.set('closed');
        this.startPolling();
      }
    } catch (err) {
      this.fail(err);
    }
  }

  private startPolling(): void {
    this.pollTimer ??= setInterval(() => void this.loadStatus(), STATUS_POLL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }

  private fail(err: unknown): void {
    this.error.set(err instanceof HttpErrorResponse && err.status === 404 ? 'No tienes acceso a esta sala. Revisa que estés inscrito en la clase.' : apiErrorMessage(err));
    this.stage.set('error');
  }

  protected reload(): void {
    this.error.set(null);
    this.stage.set('loading');
    void this.loadStatus();
  }

  // ---------- Entrar y salir ----------

  protected async join(): Promise<void> {
    this.error.set(null);
    this.stage.set('joining');
    try {
      const joined = await this.service.join(this.courseUuid());
      this.joined.set(joined);
      const { default: Daily } = await import('@daily-co/daily-js');
      const call = Daily.createCallObject({ subscribeToTracksAutomatically: true });
      this.call = call;
      this.listen(call);
      await call.join({ url: joined.room_url, token: joined.token, startVideoOff: false, startAudioOff: false });
      this.sync();
      this.stage.set('in-call');
    } catch (err) {
      await this.destroyCall();
      if (err instanceof HttpErrorResponse) {
        // 409: la sala se cerró mientras tanto; se vuelve a mirar el estado
        if (err.status === 409) {
          this.error.set(apiErrorMessage(err));
          await this.loadStatus();
          return;
        }
        this.fail(err);
        return;
      }
      this.error.set('No se pudo conectar a la videollamada. Revisa tu conexión e intenta de nuevo.');
      this.stage.set('lobby');
    }
  }

  private listen(call: DailyCall): void {
    const sync = () => this.sync();
    call.on('participant-joined', sync).on('participant-updated', sync).on('participant-left', sync).on('track-started', sync).on('track-stopped', sync);
    call.on('camera-error', () => this.notice.set('No pudimos usar tu cámara o tu micrófono. Revisa los permisos del navegador.'));
    call.on('left-meeting', () => {
      // Si nadie pulsó "Salir", la sala nos sacó: terminó la clase, venció el token o el profe nos expulsó
      if (this.stage() === 'in-call') void this.removedFromCall();
      void this.destroyCall();
    });
    call.on('error', () => {
      if (this.stage() === 'in-call') void this.removedFromCall();
      void this.destroyCall();
    });
  }

  /** Lee los participantes de Daily y actualiza la pantalla (signals: la app es zoneless) */
  private sync(): void {
    const call = this.call;
    if (!call) return;
    const all = call.participants();
    const people = Object.values(all).map(toView);
    // Primero el profe, luego tú, luego el resto
    people.sort((a, b) => Number(b.isOwner) - Number(a.isOwner) || Number(b.isLocal) - Number(a.isLocal) || a.name.localeCompare(b.name));
    this.participants.set(people);
    const local = all.local ? toView(all.local) : null;
    this.localAudio.set(!!local?.audioOn);
    this.localVideo.set(!!local?.videoOn);
    this.localScreen.set(!!local?.screenTrack);
  }

/** Daily nos sacó: si fue el profe lo dice el API (queda registrado); si no, terminó la clase o salimos */
  private async removedFromCall(): Promise<void> {
    const fallback: Stage = this.classOver() ? 'ended' : 'left';
    this.stage.set(fallback);
    if (this.isTeacher()) return;
    try {
      const status = await this.service.status(this.courseUuid());
      if (status.ejected) this.stage.set('ejected');
    } catch {
      // se queda en "saliste" o "terminó"
    }
  }

  private classOver(): boolean {
    const session = this.joined()?.session;
    return !!session && new Date(session.ends_at).getTime() <= Date.now() + 5_000;
  }

  protected async leave(): Promise<void> {
    this.stage.set('left');
    await this.destroyCall();
  }

  private async destroyCall(): Promise<void> {
    const call = this.call;
    this.call = null;
    if (!call) return;
    try {
      await call.leave();
    } catch {
      // ya estaba fuera
    }
    await call.destroy().catch(() => undefined);
  }

  // ---------- Controles ----------

  protected toggleAudio(): void {
    this.call?.setLocalAudio(!this.localAudio());
  }

  protected toggleVideo(): void {
    this.call?.setLocalVideo(!this.localVideo());
  }

  protected toggleScreen(): void {
    if (this.localScreen()) this.call?.stopScreenShare();
    else this.call?.startScreenShare();
  }

  /** Solo el profe (dueño de la sala): apaga el micrófono de otra persona */
  protected mute(sessionId: string): void {
    if (this.isTeacher()) this.call?.updateParticipant(sessionId, { setAudio: false });
  }

/** Solo el profe: saca a un estudiante de esta clase, con confirmación. No puede volver a entrar a esta clase. */
  protected askEject(person: ParticipantView): void {
    if (!this.isTeacher() || !person.userId) return;
    this.confirmation.confirm({
      header: 'Expulsar de la clase',
      message: `¿Sacar a ${person.name} de esta clase? No podrá volver a entrar a esta clase; sí a las siguientes.`,
      icon: 'pi pi-ban',
      acceptLabel: 'Expulsar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eject(person)
    });
  }

  private async eject(person: ParticipantView): Promise<void> {
    try {
      // Primero queda registrado (no podrá volver); luego sale de la llamada al instante
      await this.service.eject(this.courseUuid(), person.userId!);
      this.call?.updateParticipant(person.id, { eject: true });
      this.toast.success(`${person.name} salió de la clase.`);
    } catch (err) {
      this.toast.error(apiErrorMessage(err));
    }
  }

  // ---------- Formato ----------

  protected time(iso: string): string {
    return new Date(iso).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  protected timeRange(session: RoomSession): string {
    return `${this.time(session.starts_at)} – ${this.time(session.ends_at)}`;
  }

  protected dateLabel(iso: string): string {
    const date = new Date(iso);
    return `${date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${this.time(iso)}`;
  }
}
