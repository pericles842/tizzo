import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { ProgressBar } from 'primeng/progressbar';
import { roomPath } from '../../../../core/live/session-phase';
import { LiveClass } from '../../data/dashboard.models';

/** Próxima clase en vivo: estado, curso, acciones y progreso del curso (sobre el degradado de marca) */
@Component({
  selector: 'app-live-class-card',
  imports: [RouterLink, ButtonDirective, Tag, ProgressBar],
  template: `
    <section class="tz-bg-gradient flex h-full flex-col rounded-[1.25rem] p-6 text-white sm:p-7" aria-labelledby="clase-en-vivo">
      <p-tag [value]="liveClass().status" [icon]="liveClass().phase === 'upcoming' ? 'pi pi-clock' : 'tz-live-dot !bg-white'" [rounded]="true" class="self-start text-[0.6875rem] uppercase tracking-wide text-white" [class]="liveClass().phase === 'upcoming' ? 'bg-white/20' : 'bg-tz-live'" />

      <h2 id="clase-en-vivo" class="mt-4 text-2xl font-semibold text-white sm:text-3xl">{{ liveClass().courseTitle }}</h2>
      <p class="mt-2 text-sm text-white/85">{{ liveClass().meta }}</p>

      <div class="mt-5 flex flex-wrap items-center gap-3">
        @if (liveClass().phase === 'upcoming') {
          <button pButton type="button" label="Entrar a la sala" icon="pi pi-video" severity="warn" [disabled]="true"></button>
          <span class="text-xs text-white/85">La sala abre 10 minutos antes.</span>
        } @else {
          <a pButton [routerLink]="room()" label="Entrar a la sala" icon="pi pi-video" severity="warn"></a>
        }
        <a pButton routerLink="/app/calendario" label="Ver calendario" severity="secondary" [outlined]="true" class="border-white/60 text-white hover:bg-white/10"></a>
      </div>

      @if (liveClass().totalSessions) {
      <div class="mt-auto pt-6">
        <div class="flex justify-between text-xs text-white/85">
          <span id="progreso-curso">Progreso del curso</span>
          <span>{{ liveClass().completedSessions }} de {{ liveClass().totalSessions }} clases</span>
        </div>
        <p-progressbar
          [value]="progress()"
          [showValue]="false"
          aria-labelledby="progreso-curso"
          class="mt-2 block h-1.5 bg-white/30 [&_.p-progressbar-value]:bg-white"
        />
      </div>
      }
    </section>
  `,
  host: { class: 'block h-full' }
})
export class LiveClassCard {
  readonly liveClass = input.required<LiveClass>();
  protected readonly progress = computed(() => Math.round((this.liveClass().completedSessions / (this.liveClass().totalSessions || 1)) * 100));
  protected readonly room = computed(() => roomPath(this.liveClass().courseUuid));
}
