# tizzo (frontend)

Frontend de Tizzo. Contexto general en `../CLAUDE.md` y `../docs/`. Colores y semántica en `../docs/BRANDING.md`.

## Stack

- Angular 20 con SSR, componentes standalone, signals y zoneless.
- **Tailwind CSS 4** vía PostCSS (`.postcssrc.json`) + `tailwindcss-primeui`.
- **PrimeNG 20** + `@primeuix/themes` (Aura) + `primeicons` + `@angular/animations`.
- **No usar** Spartan UI ni PrimeFlex.

> PrimeNG está fijado en la versión 20 porque PrimeNG 21+ exige Angular 22. No actualizar PrimeNG sin actualizar Angular.

## REGLAS DE UI (obligatorias)

1. **Controles de PrimeNG, siempre:** botones (`pButton` sobre `<button>`/`<a>`/`<label>`), inputs (`pInputText`, `p-password`, `p-inputnumber`, `pTextarea`), `p-select`, `p-badge`, `p-tag`, `p-avatar`, `p-card`, `p-drawer`, `p-message`... No crear botones, selects ni badges a mano. La marca se les da en el **preset** (`src/app/tizzo.preset.ts`), no con estilos sueltos.
2. **Semántica de color:** todo color sale de un token con significado que ya tiene su valor claro y oscuro (`text-tz-title`, `text-tz-body`, `bg-tz-section`, `bg-tz-surface`, `border-tz-line`...). **Nunca** hex sueltos en componentes ni duplicar con `dark:`. Si falta un significado, se agrega el token en `src/tailwind.css` (`:root` y `.app-dark`) y en `docs/BRANDING.md`.
3. **Cada componente o feature nuevo se ve bien en claro y oscuro** y en móvil (375 px sin scroll horizontal).
4. Tipografía: `font-display` (Poppins) en títulos, `font-sans` (Inter) en textos.

### Severidades de PrimeNG con significado de marca

| Uso | Cómo |
|---|---|
| Acción principal ("Crear cuenta", "Buscar clase", "Reservar clase") | `pButton` sin severidad (primario). Claro: `#7B61FF`. Oscuro: degradado `#B39CFF → #7C5CFF` (regla `.app-dark .p-button` en `tailwind.css`, porque `light-dark()` no acepta degradados). |
| Acento amarillo ("Quiero dar clases", "Agregar") | `severity="warn"` (en Tizzo `warn` = acento amarillo, **no** advertencia) |
| Acción neutra con borde ("Entrar", chips de temas) | `severity="secondary" [outlined]="true"` |
| Enlaces de navegación, "Atrás", iconos | `severity="secondary" [text]="true"` |
| Indicador "En vivo" (home, profes) | `<p-badge value="EN VIVO" severity="danger" />` |
| Clase **en curso** (calendarios, diálogo, sala) | `<span class="tz-on-air-tag"><span class="tz-on-air-dot"></span>EN VIVO</span>` (verde, punto que late). El estado sale **solo de las fechas** con `sessionPhase` de `core/live/session-phase.ts`. |

- **Avisos pasajeros** (éxito o error de una acción: "Ya estás inscrito", "La clase se canceló"): siempre un toast de PrimeNG arriba al centro (`top-center`, con animación de entrada y salida) con `ToastService` (`core/notify`, `success()` / `error()`); el `<p-toast position="top-center" />` vive en `App`. No usar `p-message` para eso: `p-message` queda solo para errores de carga o de un formulario, dentro de la pantalla.
- En `p-avatar`/`p-card` usar `class` (no `styleClass`, está obsoleto en PrimeNG 20).
- En `p-select` dentro de una `tz-card` usar `appendTo="body"` (el `backdrop-filter` rompe el posicionamiento del menú).
- `light-dark(...)` en el preset solo con **colores**: con un degradado CSS descarta toda la declaración.

## Estructura de `src/app`

```
core/        servicios y lógica sin UI
  auth/      AuthService (sesión en signals), auth.guards (authGuard, guestGuard), auth.models
  http/      credentialsInterceptor (withCredentials al API), api-error (mensajes y fields del API)
  theme/     ThemeService (claro/oscuro)
  catalog/   listas fijas (países)
  live/      session-phase: en vivo / sala abierta / terminó, SOLO por las fechas (10 min antes = sala abierta), y roomPath
  notifications/ NotificationService: campana (GET /notifications) + WebSocket (socket.io-client, cargado bajo demanda);
             se desconecta solo al cerrar sesión
shared/      componentes reutilizables
  class-join/    class-join-bar: estado de la clase (EN VIVO, sala abierta, terminó) + "Entrar a la sala" (activo de 10 min antes al fin)
  header-web/    header del sitio: logo, navegación, tema, Entrar/Crear cuenta (o avatar/Salir); p-drawer en móvil
  footer-web/    pie de página
  catalog-card/  tarjeta de una clase o curso publicado (la usan /clases y el home); solo recibe un CatalogItem
  teacher-card/  tarjeta de profe REAL (TeacherCardData del API: avatar, especialidades, valoración, "Desde $X", clases por dar, EN VIVO) con "Ver perfil" a /profes/:uuid; [removable] agrega "Quitar de favoritos"
  auth-shell/    layout de autenticación = PARTE 1 (auth-aside: panel de marca, solo cambia el texto) + PARTE 2 (contenido; slot [authTop])
  step-progress/ barras de progreso + "Paso X de N · nombre"
  password-strength/ medidor de seguridad (showMeter) y reglas con check (showRules)
  choice-card/   tarjeta de opción única con p-radiobutton ([(selected)])
  topic-picker/  chips de temas de selección múltiple ([(selected)] con ids)
  logo (input inverse = blanco), theme-toggle, user-avatar, form/ (field-error, form-utils)
layouts/     public-layout (header + página + footer)
pages/       páginas del sitio público
  home/          hero + buscador + clase en vivo, CTA de profes; home.data.ts (datos de EJEMPLO)
    components/  available-classes ("Clases disponibles": hasta 6 clases reales del catálogo, cargadas en el navegador), teacher-explorer (temas de ejemplo + profes destacados reales), how-it-works (cómo funciona)
  login          AuthShell
  register       AuthShell, 4 pasos (diseño de Figma): datos personales, contraseña, objetivo, intereses
features/    áreas grandes con su propio layout, rutas, páginas, widgets y datos
  catalog/                   público: /clases (catalog-page: buscador único de profe/clase/curso, panel components/catalog-filters en columna o p-drawer en móvil,
                             chips, orden y p-paginator; la búsqueda vive en la URL, ver catalog-query.ts) y /clases/:slug (course-page: la pantalla
                             de detalle con "Reservar"; sin sesión manda a /ingresar?redirect=... ; TEMPORAL: reservar confirma sin pago)
  room/                      /sala/:courseUuid (pantalla completa, authGuard): room-page con Daily en modo call object y la UI de Tizzo
                             (sala cerrada con la próxima clase, lobby, llamada, salió, terminó), video-tile (video o iniciales, audio,
                             "Silenciar" para el profe), room.service (estado y token; el token nunca se guarda)
  teachers/                  público: /profes (teachers-page: buscador y tarjetas, en la URL ?q=&pagina=) y /profes/:uuid (teacher-page: perfil público con TODAS sus clases y cursos por dar desde /catalog?teacher= y el botón de favoritos); teachers.service. Se renderizan en el navegador (RenderMode.Client)
  dashboard/                 área privada /app (diseño de Figma)
    dashboard.routes.ts      rutas hijas: '' (Inicio), calendario, certificados, profesores | estudiantes, comunidad, tareas, academias
    layout/
      dashboard-layout       menú lateral fijo (escritorio) / p-drawer (móvil) + header + aviso de profe en revisión
      dashboard-header/      título de la sección (data.pageTitle), tema, notificaciones, menú de usuario (p-menu)
      notification-bell/     campana: contador (p-overlaybadge), lista en p-popover, marcar leído, abre el enlace del aviso
      dashboard-sidebar/     opciones del menú, contador (p-badge) y "Cerrar sesión"
      dashboard-nav.ts       opciones del menú y a qué rol se muestran (navForRole)
    pages/
      home/                  "Inicio": arma los widgets con los datos del rol
      profile/               "Perfil" del profe (solo rol teacher, protegido con teacherGuard): teacher-profile-page.ts arma
                             components/ profile-summary (estado + % completo), profile-form (titular, bio y ESPECIALIDADES: p-multiselect
                             agrupado por área + un renglón por especialidad con sus años obligatorios), photo-card (foto, usa AuthService),
                             signature-card (firma) y credentials-card (lista, agregar con todos los campos obligatorios, ver archivo,
                             quitar con p-confirmdialog);
                             teacher-profile.service.ts (API), profile.utils.ts (% de perfil completo), profile.models.ts
      coming-soon/           secciones aún no hechas (se configura desde data de la ruta)
      student-calendar/      "Calendario" del estudiante (misma ruta; `teacherMatch` manda al profe al suyo): solo lectura, sus clases
                             (GET /student/calendar) y class-info-dialog (datos, profe, EN VIVO y "Entrar a la sala"). Usa calendar-page.css.
      favorite-teachers/     "Profesores" del estudiante (studentGuard): sus profes favoritos con app-teacher-card [removable]
      tasks/                 "Tareas" (misma ruta para los dos roles, con teacherMatch): tasks.models, tasks.service (API y enlaces a los PDF privados), tasks.utils (fechas "Vence hoy a las…", etiquetas de estado SIN verde: entregada = primario violeta, pendiente = secondary, vence en <24 h = warn, vencida = danger);
                             components/pdf-dropzone (arrastrar o elegir un PDF, máx. 10 MB). teacher/: teacher-tasks-page (lista y filtros), task-editor-page (/tareas/nueva y /tareas/:uuid/editar: tarjetas
                             numeradas tipo → alcance (curso → clase) → detalles → fecha → PDF, panel "Se asigna a" + vista previa del aviso + acciones; el PDF se sube al guardar), teacher-task-detail-page
                             (resumen, estudiantes con filtro Todos/Entregaron/Faltan, cerrar, eliminar borrador). student/: student-tasks-page (Pendientes/Entregadas/Vencidas) y student-task-page (guía y entrega)
      student-profile/       "Perfil" del estudiante (misma ruta /app/perfil; `teacherMatch` manda al profe al suyo): student-profile-page arma components/ student-profile-form (datos y temas, guarda con AuthService.updateStudentProfile), student-profile-summary (estado y % completo) y reutiliza el photo-card del profe (input `hint`). Todo sale de la sesión: sin pantalla de carga. student-profile.utils (completitud, zonas horarias).
      calendar/              "Calendario" del profe (solo rol teacher). live-events.ts (compartido): contenido de cada evento con
                             "EN VIVO", clase verde `tz-event-live` y refresco cada 30 s sin pedir al API (refreshLivePhases).
                             calendar-page.ts (FullCalendar 6 con barra propia de PrimeNG: Mes/Semana/Lista; tocar un día abre el diálogo, arrastrar mueve, tocar una clase la muestra y la cancela;
                             abre en Mes por defecto, también en móvil) + calendar-page.css (la cuadrícula con tokens, violeta = clase de curso, amarillo = clase suelta, borde punteado = borrador),
                             components/ schedule-dialog (pregunta "¿clase o curso?" y aloja el formulario), class-form, course-form (clases con su fecha, hora y duración; la siguiente
                             se propone una semana después), offer-fields (título, descripción, precio USD, máximo de integrantes y "qué aprenderás", comunes a los dos), range-fields (empieza / termina con selector de solo lectura; la duración sale del rango y mover el inicio mueve el fin), points-input (input + chips, hasta 15),
                             session-dialog (miniatura, datos, personas inscritas, "Vista previa" y cancelar con p-confirmdialog), course-preview-dialog (la pantalla de detalle en un diálogo grande) y templates-card (usar o borrar plantillas);
                             teaching.service.ts (API), calendar.models.ts, calendar.utils.ts (fecha sugerida, semanas, formato)
    (shared/) course-detail/  pantalla de detalle de una clase o curso, solo con datos (`CourseDetail`): course-detail-view arma course-hero, learning-points-card, course-program-card, course-teacher-card y booking-card (`[preview]` desactiva reservar); course-detail.utils (dinero, próxima clase, días); course-cover (miniatura 16:9 o fondo de marca), enrolled-list (inscritos "N de M") y cover-picker (elegir la miniatura). Pensados para reusarlos en la página pública.
    widgets/                 un componente por bloque; todos usan widget-card (p-card + título + "Ver todos")
      live-class-card, stat-card, week-calendar, task-list, people-list, certificates-summary, community-feed
    data/
      dashboard.models.ts    tipos (lo que luego devolverá el API)
      dashboard.mock.ts      datos de PRUEBA por rol (estudiante / profe); la semana se arma alrededor de hoy
```

- Rutas (`app.routes.ts`): `/` (layout público, con `/clases` y `/clases/:slug`), `/sala/:courseUuid` (pantalla completa, authGuard; `RenderMode.Client` igual que `/clases`), `/ingresar` y `/registro` (pantalla completa con AuthShell, sin header; guestGuard; registro acepta `?rol=estudiante|profe` y preselecciona el objetivo), `/app` (authGuard → `features/dashboard`). **Layouts y páginas con `loadComponent`/`loadChildren`** (mantiene el bundle inicial < 600 kB).
- **Rutas por rol:** `authGuard` protege todo `/app`; para pantallas de un solo rol agregar además `canActivate: [teacherGuard]` (un estudiante que entre por URL vuelve a `/app`) y `roles` en `dashboard-nav.ts` para ocultar la opción.
- **Confirmaciones destructivas:** `p-confirmdialog` + `ConfirmationService` declarado en `providers` del componente que lo usa (ver `credentials-card`). Botón de aceptar con `acceptButtonStyleClass="p-button-danger"`.
- **Archivos privados** (credenciales): no se muestran con `<img>`; se abren por la ruta del API con la cookie de sesión (`<a target="_blank" [href]="service.credentialFileUrl(uuid)">`).
- **Firma y documentos sobre papel:** se previsualizan sobre `bg-tz-paper` (blanco fijo en ambos temas) y el texto que va encima usa `text-tz-on-paper`.
- **Estado de guardado:** el aviso "Cambios guardados" se quita solo con `form.dirty`; un `form.reset()` programático (al recibir lo guardado) no debe borrarlo.
- `shared/file-picker`: botón de PrimeNG que abre el selector de archivos (`<app-file-picker (picked)>`); validar con `checkFile` de `form-utils`.
- **Dashboard:** cada sección nueva del menú = ruta en `dashboard.routes.ts` (con `data.pageTitle` para el título del header) + opción en `dashboard-nav.ts` (con `roles` si depende del rol). Los bloques de una sección van en `widgets/` y reciben sus datos por `input`; los datos de prueba viven solo en `data/dashboard.mock.ts`, para cambiarlos por el API sin tocar los componentes.
- **Registro:** los textos de cada paso (panel de marca y formulario) están en `STEPS` de `register.ts`; el paso 4 cambia de "aprender" a "enseñar" según el objetivo (`TEACHER_INTERESTS`). Los errores del API se aplican **después** de mostrar el paso (al montarse, el formulario se revalida y borraría el error).
- `<app-field-error errorId="...">` (no `id`: duplicaría el id en el elemento).
- Los chips que cambian de estado se dibujan con **un `pButton` por estado** (`@if`): `pButton` no quita `p-button-outlined` si `[outlined]` cambia en caliente.
- Secciones del home con ancla: `#explorar`, `#destacados`, `#como-funciona` (el header enlaza con `routerLink="/" fragment="..."`; `anchorScrolling` activado).
- Las páginas centran su contenido con `tz-container`; el layout público deja el `<main>` a ancho completo para que las secciones pinten su fondo de borde a borde.

## Sesión (cookie httpOnly)

- El token **nunca** pasa por JavaScript: el API deja la cookie `tizzo_session` (httpOnly, SameSite=Lax) y el navegador la manda sola. `credentialsInterceptor` pone `withCredentials` en las peticiones a `environment.apiUrl`.
- `AuthService.ensureSession()` pregunta `/auth/me` una vez (lo dispara `provideAppInitializer` y lo esperan los guards). En el servidor la sesión queda `unknown`.
- Por eso `/app/**` se renderiza **solo en el navegador** (`RenderMode.Client`); lo público se prerenderiza.
- Nada de `localStorage`/`window`/`matchMedia` fuera de `isPlatformBrowser` (SSR).

## Tema claro / oscuro

- `src/index.html` aplica el tema **antes de pintar** (`localStorage['tizzo-theme']` o el del sistema). `ThemeService` lo lee de `<html>` y maneja los cambios. Clave `tizzo-theme`, clase `app-dark` (compartida por Tailwind y PrimeNG).

## Formularios

- Reactive forms (`NonNullableFormBuilder`). Errores con `<app-field-error [control] id>` y `aria-describedby`.
- Errores del API: `apiErrorMessage(err)` y `applyServerErrors(apiFieldErrors(err), mapa)`.

## Pruebas

- `npx ng test --watch=false --browsers=ChromeHeadless`: `App`, `ThemeService`, `AuthService`, `TeacherCard`, `TopicPicker`, reglas y medidor de contraseña, semana y menú por rol del dashboard, `FilePicker`, el porcentaje de perfil completo, las utilidades de fecha del calendario , `sessionPhase` y la búsqueda del catálogo en la URL (`catalog-query`) (92 en total, 9 de octubre de 2026).
- `npx ng build` sin avisos.

## Estado (5 de octubre de 2026)

- **Integración de clase** (5 de octubre de 2026, ver `../docs/INTEGRACION_CLASE.md`): catálogo `/clases` y página `/clases/:slug` con reserva, calendario del estudiante (solo lectura) con diálogo y "Entrar a la sala", clases en curso en verde con EN VIVO en los dos calendarios, campana con WebSocket y la sala `/sala/:courseUuid` con la interfaz de Tizzo sobre Daily (call object). Verificado: 34 pasos en el navegador (catálogo, reserva con redirección a ingresar, calendario y diálogo, verde y punto que late, aviso en vivo, leer avisos, sala cerrada/lobby/sin acceso, profe, oscuro, móvil 375 px) y una **llamada real** en Daily con profe y estudiante (18 pasos: video en ambos lados, cámara y micrófono, el profe silencia, salir).
- `@daily-co/daily-js` y `socket.io-client` se cargan con `import()` dinámico (no pesan en el bundle inicial). `allowedCommonJsDependencies` en `angular.json` (`debug`, `xmlhttprequest-ssl`, de socket.io-client) para compilar sin avisos.
- **Horas siempre en 12 horas** (a. m. / p. m.): `hourFormat="12"` en `p-datepicker`, y `{ hour: 'numeric', minute: '2-digit', hour12: true }` en `toLocaleTimeString` y en FullCalendar (`slotLabelFormat`, `eventTimeFormat`). Nunca `hour12: false` ni `hourFormat="24"`.
- PrimeIcons **no tiene** `pi-microphone-slash`: para "micrófono apagado" se usa `pi-volume-off`.

- **Home según Figma** (claro y oscuro): header-web, hero con buscador y clase en vivo, **clases disponibles (reales, del API)**, explorador por tema, profes destacados (tarjetas iteradas), cómo funciona, CTA de profes y footer. El buscador del hero lleva a `/clases?q=`. **Siguen con datos de ejemplo** (`home.data.ts`): clase en vivo del hero y chips de temas. Los **profes destacados** ya son reales (API `/teachers`, "Ver todos" a `/profes`).
- **Registro de 4 pasos e ingresar según Figma** (2 de octubre de 2026), con el layout de dos partes reutilizable, en claro, oscuro y móvil. Verificado de punta a punta (14 pasos: validaciones, medidor, aprender/enseñar, temas, correo repetido, `?rol=profe`, login).
- **Tareas tipo documento** (6 de octubre de 2026): editor, lista y detalle del profe; "Mis tareas" y entrega del estudiante. Verificado en el navegador (34 pasos: validaciones, alcance y clase suelta grupal, panel de asignados, publicar con confirmación, aviso, entrega a tiempo, filtro "Faltan", edición bloqueada de una publicada, cerrar, borrador y eliminar, acceso por rol, móvil 375 px y oscuro). **Los estilos en línea (`styles:`) se compilan como Sass indentado**: usar clases de Tailwind en vez de CSS en el componente.
- **Profes y favoritos** (6 de octubre de 2026): perfil público /profes/:uuid, listado /profes, profes reales en "Profes destacados" del home y en la búsqueda de /clases, favoritos del estudiante en "Profesores". Verificado en el navegador (34 pasos: listado, destacado primero, profe sin clases, pendiente 404, buscador de /clases con profes, home real, perfil con sus 2 clases, favoritos agregar/quitar/persistir, visitante, profe sin favoritos y 403, "Ver perfil" desde clase y favoritos, oscuro y móvil 375 px).
- **Perfil del estudiante** (`/app/perfil`, 6 de octubre de 2026): foto, estado del perfil y datos personales con temas. Verificado en el navegador (30 pasos: acceso por rol, datos cargados, foto con % y header al instante, validaciones, sin temas, guardado en la base, persistencia al recargar, quitar foto, el profe sigue con lo suyo, oscuro y móvil 375 px) y 5 pruebas unitarias.
- **Perfil del profe** (`/app/perfil`, 2 de octubre de 2026): foto, titular, biografía, **especialidades (categorías en selección múltiple, cada una con su renglón de años obligatorios)**, firma y credenciales (todos los campos obligatorios). Verificado de punta a punta en el navegador (16 pasos: acceso por rol, selector agrupado, años obligatorios, persistencia, foto en tarjeta y header, firma, credencial con 5 errores y fecha futura, quitar con confirmación, oscuro y móvil) y 36 pruebas unitarias.
- **Formulario con lista de renglones** (`profile-form`): un `FormArray` de grupos `{ category_id, years }` sincronizado con el `p-multiselect` (`syncRows`); al recibir lo guardado se reconstruye con `{ emitEvent: false }` para no borrar el aviso "Cambios guardados". El campo de años va en un contenedor de ancho fijo con `[fluid]="true"` (el `class` del host de `p-inputnumber` no limita su input interno).
- **Quizzes y limpieza de tareas** (9 de octubre de 2026): el editor ofrece **Quiz primero** (elegido por defecto) y Documento; el quiz arma preguntas en un `FormArray` (de opciones A, B, C… con una o varias correctas, o de respuesta libre). Se quitó el borrador (solo "Publicar y notificar"), la casilla de correo y la "clase individual". El estudiante responde en `student-task-page` (un intento, confirmación, nota sobre 100 y sus respuestas) y el profe ve notas y lo escrito en `teacher-task-detail-page`. Verificado en el navegador (13 pasos: orden de tarjetas, errores, armado, publicar con toast al centro, responder en 375 px, nota, recarga sin reintento, oscuro, resultados del profe).
- **Seguridad para menores** (9 de octubre de 2026): `core/auth/age.ts` (mayoría 18, `AUDIENCE_OPTIONS`, `AUDIENCE_TAG`, fechas locales `toIsoDate`/`fromIsoDate`). Registro: fecha de nacimiento (`p-datepicker`) y, si es menor, el correo del representante (validador que se activa con la fecha). `AuthService.needsGuardian` muestra el aviso del panel; `student-profile/components/guardian-card` reenvía o cambia el correo; la fecha del perfil se bloquea una vez puesta. Página pública `features/guardian` en `/representante/:token` (RenderMode.Client). "¿Para quién es?" (`p-selectbutton`) en `offer-fields` (clase, curso y plantillas); etiqueta en `catalog-card` y `course-hero`; `course-page` muestra `viewer.blocked_reason`. Sala: botón "Expulsar" (`pi-ban`) en `video-tile` para el profe con `p-confirmdialog`; registra en el API y luego `updateParticipant(id, { eject: true })`; el estudiante expulsado ve la pantalla `ejected`. Verificado en el navegador (12 pasos: registro de menor en 390 px, aviso, reenvío, página del representante, etiquetas, bloqueo por edad, reserva del menor, pantalla de expulsado, formulario del profe). **No probado con Daily real:** el botón de expulsar dentro de una llamada.
- **Inicio con datos reales** (9 de octubre de 2026): `dashboard-home` pide el calendario (profe: `/teacher/calendar`, estudiante: `/student/calendar`) y las tareas, y `data/dashboard.live.ts` (funciones puras, con pruebas) arma la próxima clase (en vivo, sala abierta o por empezar, con "Entrar a la sala" activo de 10 min antes), "Clases esta semana", la semana y las tareas. **Dos indicadores** (se quitó "Estudiantes activos"): profe = "Tareas por revisar" (tareas publicadas sin cerrar que ya tienen entregas o respuestas; cerrarla la da por revisada), estudiante = "Tareas por entregar" (pendientes que se entregan o se responden; las de solo lectura no cuentan). Cada tarea del listado abre su pantalla. Sin clases próximas muestra una invitación (calendario o catálogo). **Siguen con datos de prueba** (`dashboard.mock.ts`): personas, certificados y comunidad. Verificado en el navegador (10 pasos: profe, estudiante, cuentas nuevas, 375 px y oscuro) y 8 pruebas unitarias nuevas.
- **Calendario del profe** (`/app/calendario`, 2 de octubre de 2026): programar **clase suelta o curso** desde el calendario, **plantillas** (guardar y usar título, descripción y demás), arrastrar para cambiar la hora, cancelar con confirmación. Verificado en el navegador (80 pasos, incluidos miniatura, inscritos y vista previa de clase y de curso: acceso por rol, pregunta clase/curso, rango inicio-fin y duración calculada, cupo, 15 puntos, validaciones, plantillas, curso de 3 clases, profe pendiente y aprobado, detalle y cancelación, vistas, uso de plantilla, claro/oscuro y móvil 375 px) y 25 pruebas unitarias nuevas (rango de fechas y utilidades del detalle). Textos de PrimeNG en español en `core/i18n/primeng-es.ts` (selector de fechas).
- **FullCalendar:** v6.1 (`@fullcalendar/angular`, `core`, `daygrid`, `timegrid`, `list`, `interaction`); no subir a la v7 sin revisar (cambia el API y pide `temporal-polyfill`). La barra de navegación y la vista son controles de PrimeNG sobre `getApi()`, con `headerToolbar: false`. Los eventos llegan con la función `events` (no con `[events]`) y se refrescan con `refetchEvents()`. Los callbacks de FullCalendar corren fuera de Angular: actualizar siempre **signals** (la app es zoneless).
- **Pruebas de interfaz:** configuración Angular `e2e` (`ng serve --configuration e2e --port 4201`) que apunta al API de pruebas en `:3100`; ver la regla en `../CLAUDE.md`.
- **Dashboard `/app` según Figma** (2 de octubre de 2026): menú lateral por rol, header propio, "Inicio" con 7 widgets y datos de prueba por rol; el resto de secciones muestran "Próximamente". Verificado en el navegador (estudiante y profe, claro/oscuro, móvil).
- Verificado en Chrome: 23 pasos del recorrido (registro, login, sesión, tema, móvil) y capturas del home en claro, oscuro y móvil.
