import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Card } from 'primeng/card';
import { Avatar } from 'primeng/avatar';
import { Badge } from 'primeng/badge';
import { Tag } from 'primeng/tag';
import { TeacherExplorer } from './components/teacher-explorer/teacher-explorer';
import { AvailableClasses } from './components/available-classes/available-classes';
import { HowItWorks } from './components/how-it-works/how-it-works';
import { HERO_HIGHLIGHTS, HERO_LIVE_CLASS, HOW_IT_WORKS, TOPICS } from './home.data';

/**
 * Home público (diseño de Figma): hero con buscador y clase en vivo, explorador de profes,
 * cómo funciona y llamado a profes. La sección "Clases disponibles" y el buscador usan el API (el catálogo /clases);
 * el resto (clase en vivo del hero, temas) sigue con datos de ejemplo; los profes destacados vienen del API.
 */
@Component({
  selector: 'app-home',
  imports: [RouterLink, ButtonDirective, InputText, Card, Avatar, Badge, Tag, TeacherExplorer, AvailableClasses, HowItWorks],
  templateUrl: './home.html'
})
export class Home {
  private readonly router = inject(Router);

  protected readonly liveClass = HERO_LIVE_CLASS;
  protected readonly highlights = HERO_HIGHLIGHTS;
  protected readonly topics = TOPICS;
  protected readonly steps = HOW_IT_WORKS;

  /** El buscador del hero abre el catálogo con lo escrito */
  protected search(text: string): void {
    const q = text.trim();
    void this.router.navigate(['/clases'], { queryParams: q ? { q } : {} });
  }
}
