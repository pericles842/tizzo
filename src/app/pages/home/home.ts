import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Card } from 'primeng/card';
import { Avatar } from 'primeng/avatar';
import { Badge } from 'primeng/badge';
import { Tag } from 'primeng/tag';
import { TeacherExplorer } from './components/teacher-explorer/teacher-explorer';
import { HowItWorks } from './components/how-it-works/how-it-works';
import { FEATURED_TEACHERS, HERO_HIGHLIGHTS, HERO_LIVE_CLASS, HOW_IT_WORKS, TOPICS } from './home.data';

/**
 * Home público (diseño de Figma): hero con buscador y clase en vivo, explorador de profes,
 * cómo funciona y llamado a profes. Por ahora solo UI: el buscador y "Reservar clase" no hacen nada aún.
 */
@Component({
  selector: 'app-home',
  imports: [RouterLink, ButtonDirective, InputText, Card, Avatar, Badge, Tag, TeacherExplorer, HowItWorks],
  templateUrl: './home.html'
})
export class Home {
  protected readonly liveClass = HERO_LIVE_CLASS;
  protected readonly highlights = HERO_HIGHLIGHTS;
  protected readonly topics = TOPICS;
  protected readonly teachers = FEATURED_TEACHERS;
  protected readonly steps = HOW_IT_WORKS;
}
