import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';

interface Section {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

/** Fecha de la versión del texto (cambia cuando cambie el contenido) */
const UPDATED = '9 de octubre de 2026';

const SECTIONS: Section[] = [
  {
    title: '1. Qué es Tizzo',
    paragraphs: [
      'Tizzo es una plataforma web donde profesores dictan clases y cursos en vivo por videollamada y los estudiantes los reservan. Tizzo conecta a ambas partes, gestiona las reservas y emite diplomas al completar un curso.'
    ]
  },
  {
    title: '2. Tu cuenta',
    items: [
      'Debes dar datos verdaderos al registrarte, incluida tu fecha de nacimiento.',
      'Eres responsable de tu contraseña y de lo que se haga con tu cuenta.',
      'Ser profesor en Tizzo requiere tener 18 años o más y que el equipo de Tizzo apruebe tu perfil.'
    ]
  },
  {
    title: '3. Menores de edad',
    paragraphs: ['Una persona menor de 18 años puede usar Tizzo solo como estudiante y con la autorización de su representante:'],
    items: [
      'Al registrarse, el menor escribe el correo de su padre, madre o representante legal. Tizzo le envía un enlace para confirmar la autorización.',
      'Mientras el representante no confirme, el menor no puede reservar clases ni entrar a las salas.',
      'Al confirmar, el representante declara que estará presente junto al menor durante todas sus clases en vivo.',
      'El representante puede retirar su autorización escribiendo a Tizzo en cualquier momento.',
      'Cada clase o curso indica si es para todos, solo para adultos o solo para menores de 18. Un menor no puede reservar una clase solo para adultos, ni un adulto una solo para menores.'
    ]
  },
  {
    title: '4. Clases en vivo y conducta',
    items: [
      'La sala de cada clase abre 10 minutos antes de empezar y cierra al terminar. Para entrar debes iniciar sesión.',
      'Se espera respeto hacia el profesor y los demás estudiantes. No se permite acosar, insultar, compartir contenido ofensivo o ilegal, ni grabar o difundir la clase sin permiso.',
      'El profesor puede sacar de una clase a quien no respete estas normas. Quien es sacado no puede volver a entrar a esa clase, pero sí a las siguientes del curso.',
      'Tizzo puede suspender cuentas que incumplan estos términos.'
    ]
  },
  {
    title: '5. Profesores',
    items: [
      'El profesor fija el precio de sus clases y es responsable de su contenido y de dictarlas en el horario publicado.',
      'Tizzo cobra una comisión por clase. El porcentaje, la forma de pago y los reembolsos todavía están por definir y se publicarán aquí antes de cobrar.'
    ]
  },
  {
    title: '6. Pagos y reembolsos',
    paragraphs: ['Por ahora las reservas se confirman sin cobro. Las condiciones de pago, cancelación y reembolso se publicarán aquí antes de activar los pagos.']
  },
  {
    title: '7. Privacidad',
    paragraphs: [
      'Guardamos los datos que nos das (nombre, correo, país, fecha de nacimiento, foto y, para menores, el correo de su representante) para operar la plataforma. No mostramos tu correo ni tu teléfono a otros usuarios. Las clases no se graban.'
    ]
  },
  {
    title: '8. Cambios',
    paragraphs: ['Podemos actualizar estos términos. La fecha de la última versión aparece arriba. Si los cambios son importantes, te avisaremos en la plataforma.']
  }
];

/** Términos y condiciones (borrador sujeto a revisión legal) */
@Component({
  selector: 'app-terms',
  imports: [RouterLink, ButtonDirective, Card, Message],
  template: `
    <section class="tz-container max-w-3xl py-10">
      <h1 class="font-display text-3xl font-semibold text-tz-title">Términos y condiciones</h1>
      <p class="mt-1 text-sm">Última actualización: {{ updated }}</p>
      <p-message severity="secondary" styleClass="mt-4">Este texto es un borrador y está sujeto a revisión legal antes del lanzamiento.</p-message>

      <p-card class="mt-5 border border-tz-surface-border">
        <div class="space-y-6">
          @for (section of sections; track section.title) {
            <section>
              <h2 class="text-lg font-semibold">{{ section.title }}</h2>
              @for (text of section.paragraphs ?? []; track $index) {
                <p class="mt-2 text-sm leading-relaxed">{{ text }}</p>
              }
              @if (section.items; as items) {
                <ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                  @for (item of items; track $index) {
                    <li>{{ item }}</li>
                  }
                </ul>
              }
            </section>
          }
        </div>
      </p-card>

      <a pButton routerLink="/" label="Volver al inicio" icon="pi pi-arrow-left" severity="secondary" [text]="true" class="mt-4 -ml-3"></a>
    </section>
  `
})
export class Terms {
  protected readonly updated = UPDATED;
  protected readonly sections = SECTIONS;
}
