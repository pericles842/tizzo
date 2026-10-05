import { Component, DestroyRef, PLATFORM_ID, computed, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { JOIN_EARLY_MIN, canJoin, phaseLabel, roomPath, sessionPhase } from '../../core/live/session-phase';

/**
 * Estado de una clase según la hora (en vivo, sala abierta, terminó...) y el botón "Entrar a la sala", que solo se
 * activa desde 10 minutos antes del inicio hasta el fin. Lleva a la sala de Tizzo (/sala/<uuid del curso>), donde el
 * API vuelve a comprobar el acceso. Lo usan el diálogo de la clase del profe y el del estudiante.
 */
@Component({
  selector: 'app-class-join-bar',
  imports: [ButtonDirective, RouterLink],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tz-line bg-tz-soft px-3 py-2.5">
      <p class="flex min-w-0 items-center gap-2 text-sm" role="status">
        @if (phase() === 'live') {
          <span class="tz-on-air-tag"><span class="tz-on-air-dot" aria-hidden="true"></span>EN VIVO</span>
        } @else {
          <i [class]="phase() === 'ended' ? 'pi pi-check-circle' : 'pi pi-clock'" class="text-tz-subtitle" aria-hidden="true"></i>
          <span>{{ label() }}</span>
        }
      </p>
      @if (joinable()) {
        <a pButton [routerLink]="path()" label="Entrar a la sala" icon="pi pi-video" size="small"></a>
      } @else if (phase() !== 'ended') {
        <button pButton type="button" label="Entrar a la sala" icon="pi pi-video" size="small" [disabled]="true"></button>
      }
    </div>
    @if (phase() === 'upcoming') {
      <p class="tz-hint">El botón se activa {{ earlyMin }} minutos antes del inicio.</p>
    }
  `,
  host: { class: 'block' }
})
export class ClassJoinBar {
  readonly startsAt = input.required<string>();
  readonly endsAt = input.required<string>();
  readonly courseUuid = input.required<string>();

  protected readonly earlyMin = JOIN_EARLY_MIN;
  /** Hora actual, que avanza sola para que el botón se active sin recargar */
  private readonly now = signal(new Date());

  protected readonly phase = computed(() => sessionPhase(this.startsAt(), this.endsAt(), this.now()));
  protected readonly joinable = computed(() => canJoin(this.phase()));
  protected readonly label = computed(() => phaseLabel(this.phase()));
  protected readonly path = computed(() => roomPath(this.courseUuid()));

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const timer = setInterval(() => this.now.set(new Date()), 15_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
