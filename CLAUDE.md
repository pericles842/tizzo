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
| Indicador "En vivo" | `<p-badge value="EN VIVO" severity="danger" />` |

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
shared/      componentes reutilizables
  header-web/    header del sitio: logo, navegación, tema, Entrar/Crear cuenta (o avatar/Salir); p-drawer en móvil
  footer-web/    pie de página
  teacher-card/  tarjeta de profe (p-card + p-avatar + p-badge + pButton); se itera en listados
  auth-shell/    layout de autenticación = PARTE 1 (auth-aside: panel de marca, solo cambia el texto) + PARTE 2 (contenido; slot [authTop])
  step-progress/ barras de progreso + "Paso X de N · nombre"
  password-strength/ medidor de seguridad (showMeter) y reglas con check (showRules)
  choice-card/   tarjeta de opción única con p-radiobutton ([(selected)])
  topic-picker/  chips de temas de selección múltiple ([(selected)] con ids)
  logo (input inverse = blanco), theme-toggle, user-avatar, form/ (field-error, form-utils)
layouts/     public-layout (header + página + footer)
pages/       páginas del sitio público
  home/          hero + buscador + clase en vivo, CTA de profes; home.data.ts (datos de EJEMPLO)
    components/  teacher-explorer (temas + profes destacados), how-it-works (cómo funciona)
  login          AuthShell
  register       AuthShell, 4 pasos (diseño de Figma): datos personales, contraseña, objetivo, intereses
features/    áreas grandes con su propio layout, rutas, páginas, widgets y datos
  dashboard/                 área privada /app (diseño de Figma)
    dashboard.routes.ts      rutas hijas: '' (Inicio), calendario, certificados, profesores | estudiantes, comunidad, tareas, academias
    layout/
      dashboard-layout       menú lateral fijo (escritorio) / p-drawer (móvil) + header + aviso de profe en revisión
      dashboard-header/      título de la sección (data.pageTitle), tema, notificaciones (p-overlaybadge), menú de usuario (p-menu)
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
    widgets/                 un componente por bloque; todos usan widget-card (p-card + título + "Ver todos")
      live-class-card, stat-card, week-calendar, task-list, people-list, certificates-summary, community-feed
    data/
      dashboard.models.ts    tipos (lo que luego devolverá el API)
      dashboard.mock.ts      datos de PRUEBA por rol (estudiante / profe); la semana se arma alrededor de hoy
```

- Rutas (`app.routes.ts`): `/` (layout público), `/ingresar` y `/registro` (pantalla completa con AuthShell, sin header; guestGuard; registro acepta `?rol=estudiante|profe` y preselecciona el objetivo), `/app` (authGuard → `features/dashboard`). **Layouts y páginas con `loadComponent`/`loadChildren`** (mantiene el bundle inicial < 600 kB).
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

- `npx ng test --watch=false --browsers=ChromeHeadless`: `App`, `ThemeService`, `AuthService`, `TeacherCard`, `TopicPicker`, reglas y medidor de contraseña, semana y menú por rol del dashboard, `FilePicker` y el porcentaje de perfil completo.
- `npx ng build` sin avisos.

## Estado (1 de octubre de 2026)

- **Home según Figma** (claro y oscuro): header-web, hero con buscador y clase en vivo, explorador por tema, profes destacados (tarjetas iteradas), cómo funciona, CTA de profes y footer. **Solo UI:** buscador, chips de temas, "Reservar clase" y "Ver todos" no tienen lógica todavía; los datos son de ejemplo (`home.data.ts`).
- **Registro de 4 pasos e ingresar según Figma** (2 de octubre de 2026), con el layout de dos partes reutilizable, en claro, oscuro y móvil. Verificado de punta a punta (14 pasos: validaciones, medidor, aprender/enseñar, temas, correo repetido, `?rol=profe`, login).
- **Perfil del profe** (`/app/perfil`, 2 de octubre de 2026): foto, titular, biografía, **especialidades (categorías en selección múltiple, cada una con su renglón de años obligatorios)**, firma y credenciales (todos los campos obligatorios). Verificado de punta a punta en el navegador (16 pasos: acceso por rol, selector agrupado, años obligatorios, persistencia, foto en tarjeta y header, firma, credencial con 5 errores y fecha futura, quitar con confirmación, oscuro y móvil) y 36 pruebas unitarias.
- **Formulario con lista de renglones** (`profile-form`): un `FormArray` de grupos `{ category_id, years }` sincronizado con el `p-multiselect` (`syncRows`); al recibir lo guardado se reconstruye con `{ emitEvent: false }` para no borrar el aviso "Cambios guardados". El campo de años va en un contenedor de ancho fijo con `[fluid]="true"` (el `class` del host de `p-inputnumber` no limita su input interno).
- **Pruebas de interfaz:** configuración Angular `e2e` (`ng serve --configuration e2e --port 4201`) que apunta al API de pruebas en `:3100`; ver la regla en `../CLAUDE.md`.
- **Dashboard `/app` según Figma** (2 de octubre de 2026): menú lateral por rol, header propio, "Inicio" con 7 widgets y datos de prueba por rol; el resto de secciones muestran "Próximamente". Verificado en el navegador (estudiante y profe, claro/oscuro, móvil).
- Verificado en Chrome: 23 pasos del recorrido (registro, login, sesión, tema, móvil) y capturas del home en claro, oscuro y móvil.
