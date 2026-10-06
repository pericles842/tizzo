import { Component, OnInit, PLATFORM_ID, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { TeachersService } from '../../../../features/teachers/teachers.service';
import { TeacherCard, TeacherCardData } from '../../../../shared/teacher-card/teacher-card';

/** Cuántos profes se muestran en el home antes de "Ver todos" */
const VISIBLE = 4;

/**
 * "Explora por tema" (chips, solo UI por ahora) + "Profes destacados": profes aprobados reales, los destacados, en vivo y
 * mejor valorados primero. Se cargan en el navegador (el home se prerenderiza).
 */
@Component({
  selector: 'app-teacher-explorer',
  imports: [RouterLink, ButtonDirective, Skeleton, TeacherCard],
  templateUrl: './teacher-explorer.html',
  host: { class: 'block' }
})
export class TeacherExplorer implements OnInit {
  private readonly service = inject(TeachersService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly topics = input.required<string[]>();

  protected readonly teachers = signal<TeacherCardData[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  /** Tema marcado (solo estado visual; el filtro real llega con el API) */
  protected readonly selectedTopic = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.service
      .list({ perPage: VISIBLE })
      .then(({ items }) => this.teachers.set(items))
      .catch(() => this.failed.set(true))
      .finally(() => this.loading.set(false));
  }

  protected toggleTopic(topic: string): void {
    this.selectedTopic.update((current) => (current === topic ? null : topic));
  }
}
