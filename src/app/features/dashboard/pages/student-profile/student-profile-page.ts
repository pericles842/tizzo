import { Component } from '@angular/core';
import { PhotoCard } from '../profile/components/photo-card/photo-card';
import { StudentProfileForm } from './components/student-profile-form';
import { StudentProfileSummary } from './components/student-profile-summary';

/**
 * "Perfil" del estudiante: su foto (la misma tarjeta del profe, sobre la sesión), el estado del perfil y sus datos.
 * Los datos salen de la sesión (AuthService), por eso no hay pantalla de carga.
 */
@Component({
  selector: 'app-student-profile-page',
  imports: [PhotoCard, StudentProfileForm, StudentProfileSummary],
  template: `
    <header class="mb-6">
      <p class="font-display text-3xl font-semibold text-tz-title">Tu perfil</p>
      <p class="mt-1 text-sm">Mantén tus datos al día para que tus profes te conozcan y las clases lleguen a tu hora.</p>
    </header>

    <div class="grid items-start gap-5 xl:grid-cols-3">
      <div class="xl:col-span-2">
        <app-student-profile-form />
      </div>
      <div class="space-y-5">
        <app-student-profile-summary />
        <app-photo-card hint="Una foto tuya ayuda a que tus profes te reconozcan en clase. JPG, PNG, WEBP o GIF, máx. 10 MB." />
      </div>
    </div>
  `
})
export class StudentProfilePage {}
