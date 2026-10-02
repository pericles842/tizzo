import { Component, input, signal } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { TeacherCard, TeacherCardData } from '../../../../shared/teacher-card/teacher-card';

/** "Explora por tema" (chips) + "Profes destacados" (tarjetas). Solo UI por ahora. */
@Component({
  selector: 'app-teacher-explorer',
  imports: [ButtonDirective, TeacherCard],
  templateUrl: './teacher-explorer.html',
  host: { class: 'block' }
})
export class TeacherExplorer {
  readonly topics = input.required<string[]>();
  readonly teachers = input.required<TeacherCardData[]>();

  /** Tema marcado (solo estado visual; el filtro real llega con el API) */
  protected readonly selectedTopic = signal<string | null>(null);

  protected toggleTopic(topic: string): void {
    this.selectedTopic.update((current) => (current === topic ? null : topic));
  }
}
