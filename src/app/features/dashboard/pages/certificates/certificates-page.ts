import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Image } from 'primeng/image';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { AuthService } from '../../../../core/auth/auth.service';
import { apiErrorMessage } from '../../../../core/http/api-error';
import { longDate } from '../../../certificates/certificate-date';
import { Certificate } from '../../../certificates/certificates.models';
import { CertificatesService } from '../../../certificates/certificates.service';

interface CertificateGroup {
  courseId: string;
  title: string;
  kind: 'class' | 'course';
  items: Certificate[];
}

/**
 * "Certificados": el estudiante ve y descarga sus diplomas; el profe ve los que emitió y qué necesita para darlos
 * (firma y foto de perfil). El PDF es privado: se descarga por el API con la cookie de sesión.
 */
@Component({
  selector: 'app-certificates-page',
  imports: [RouterLink, ButtonDirective, Image, Message, Skeleton, Tag],
  template: `
    <header class="mb-6">
      <p class="font-display text-3xl font-semibold text-tz-title">{{ isTeacher() ? 'Diplomas que has emitido' : 'Tus diplomas' }}</p>
      <p class="mt-1 text-sm">
        @if (isTeacher()) {
          Tizzo emite el diploma solo cuando tu estudiante asistió a todas las clases y completó todas las tareas.
        } @else {
          Se emiten solos cuando asistes a todas las clases y completas todas las tareas de una clase o curso.
        }
      </p>
    </header>

    @if (isTeacher() && missing().length) {
      <p-message severity="warn" styleClass="mb-4" role="status">
        Para que tus estudiantes reciban su diploma necesitas subir {{ missingText() }} en tu perfil: aparecen en el diploma.
        <a routerLink="/app/perfil" class="font-semibold underline">Ir a mi perfil</a>
      </p-message>
    }

    @if (error(); as message) {
      <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
      <button pButton type="button" label="Reintentar" icon="pi pi-refresh" severity="secondary" [outlined]="true" class="mb-4" (click)="load()"></button>
    }

    <div class="flex flex-col gap-8" [attr.aria-busy]="loading()">
      @if (loading()) {
        <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          @for (placeholder of [1, 2, 3]; track placeholder) {
            <p-skeleton height="12rem" borderRadius="1rem" />
          }
        </div>
      } @else {
        @for (group of groups(); track group.courseId) {
          <section [attr.aria-labelledby]="'grupo-' + group.courseId">
            <header class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 [id]="'grupo-' + group.courseId" class="font-display text-xl font-semibold text-tz-title">{{ group.title }}</h2>
              <p-tag severity="secondary" [value]="group.kind === 'course' ? 'Curso' : 'Clase'" />
              <span class="text-sm">{{ group.items.length === 1 ? '1 diploma' : group.items.length + ' diplomas' }}</span>
            </header>
            <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        @for (item of group.items; track item.uuid) {
          <article class="flex flex-col rounded-2xl border border-tz-surface-border bg-tz-surface p-5">
            @if (item.has_preview) {
              <!-- El diploma es blanco en los dos temas (papel); al tocarlo se amplía -->
              <div class="relative overflow-hidden rounded-xl border border-tz-line bg-tz-paper">
                <p-image
                  [src]="service.previewUrl(item.uuid, role())"
                  [alt]="'Vista previa del diploma de ' + item.title"
                  [preview]="true"
                  class="block"
                  imageClass="block w-full"
                />
                <p-tag class="absolute right-2 top-2" severity="secondary" [value]="item.kind === 'course' ? 'Curso' : 'Clase'" />
              </div>
            } @else {
              <div class="flex items-start justify-between gap-3">
                <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tz-soft text-tz-subtitle" aria-hidden="true"><i class="pi pi-verified text-xl"></i></span>
                @if (item.revoked) {
                  <p-tag severity="danger" value="Revocado" />
                } @else {
                  <p-tag severity="secondary" [value]="item.kind === 'course' ? 'Curso' : 'Clase'" />
                }
              </div>
            }
            <p class="mt-4 text-sm">
              @if (isTeacher()) {
                Para <strong class="text-tz-title">{{ item.student_name }}</strong>
              } @else {
                Con <strong class="text-tz-title">{{ item.teacher_name }}</strong>
              }
            </p>
            <p class="mt-1 text-sm">Emitido el {{ date(item.issued_at) }}</p>
            <p class="mt-1 text-xs">Código: <span class="font-semibold text-tz-title">{{ item.code }}</span></p>
            <div class="mt-4 flex flex-wrap gap-2">
              @if (!isTeacher() && item.has_file && !item.revoked) {
                <a pButton [href]="service.fileUrl(item.uuid)" label="Descargar PDF" icon="pi pi-download" target="_blank" rel="noopener"></a>
              }
              <a pButton [routerLink]="['/verificar', item.code]" label="Verificar" icon="pi pi-qrcode" severity="secondary" [outlined]="true"></a>
            </div>
          </article>
        }
            </div>
          </section>
        } @empty {
          @if (!error()) {
            <div class="rounded-2xl border border-dashed border-tz-line px-6 py-12 text-center">
              <i class="pi pi-verified text-3xl text-tz-subtitle" aria-hidden="true"></i>
              <p class="mt-3 font-semibold text-tz-title">{{ isTeacher() ? 'Todavía no has emitido diplomas' : 'Todavía no tienes diplomas' }}</p>
              <p class="mt-1 text-sm">
                @if (isTeacher()) {
                  Cuando un estudiante cumpla todo, su diploma aparecerá aquí.
                } @else {
                  Asiste a todas las clases y completa las tareas de una clase o curso con diploma y aparecerá aquí.
                }
              </p>
              @if (!isTeacher()) {
                <a pButton routerLink="/clases" label="Buscar clases" class="mt-4"></a>
              }
            </div>
          }
        }
      }
    </div>
  `
})
export class CertificatesPage implements OnInit {
  protected readonly service = inject(CertificatesService);
  private readonly auth = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly isTeacher = computed(() => this.auth.user()?.role === 'teacher');
  protected readonly role = computed<'student' | 'teacher'>(() => (this.isTeacher() ? 'teacher' : 'student'));
  protected readonly items = signal<Certificate[]>([]);
  /** Los diplomas agrupados por clase o curso, en el orden en que llegan (los más recientes primero) */
  protected readonly groups = computed<CertificateGroup[]>(() => {
    const byCourse = new Map<string, CertificateGroup>();
    for (const item of this.items()) {
      const group = byCourse.get(item.course_id) ?? { courseId: item.course_id, title: item.title, kind: item.kind, items: [] };
      group.items.push(item);
      byCourse.set(item.course_id, group);
    }
    return [...byCourse.values()];
  });
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Lo que le falta al profe para dar diplomas: su firma y su foto de perfil */
  protected readonly missing = computed(() => {
    const user = this.auth.user();
    const missing: string[] = [];
    if (!user?.teacher_profile?.signature_url) missing.push('tu firma');
    if (!user?.avatar_url) missing.push('tu foto de perfil');
    return missing;
  });
  protected readonly missingText = computed(() => this.missing().join(' y '));

  protected readonly date = longDate;

  ngOnInit(): void {
    // El área privada solo se renderiza en el navegador
    if (this.isBrowser) void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.items.set(this.isTeacher() ? await this.service.issued() : await this.service.mine());
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}
