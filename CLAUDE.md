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
  logo, theme-toggle, user-avatar, form/ (field-error, form-utils)
layouts/     public-layout (header + página + footer) y app-layout (área privada)
pages/
  home/          hero + buscador + clase en vivo, CTA de profes; home.data.ts (datos de EJEMPLO)
    components/  teacher-explorer (temas + profes destacados), how-it-works (cómo funciona)
  login, register (asistente paso a paso), app-home (por ahora dice "layout")
```

- Rutas (`app.routes.ts`): `/`, `/ingresar` (guestGuard), `/registro` (guestGuard, acepta `?rol=estudiante|profe`), `/app` (authGuard). **Layouts y páginas con `loadComponent`** (mantiene el bundle inicial < 600 kB).
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

- `npx ng test --watch=false --browsers=ChromeHeadless`: `App`, `ThemeService`, `AuthService`, `TeacherCard`.
- `npx ng build` sin avisos.

## Estado (1 de octubre de 2026)

- **Home según Figma** (claro y oscuro): header-web, hero con buscador y clase en vivo, explorador por tema, profes destacados (tarjetas iteradas), cómo funciona, CTA de profes y footer. **Solo UI:** buscador, chips de temas, "Reservar clase" y "Ver todos" no tienen lógica todavía; los datos son de ejemplo (`home.data.ts`).
- Login, registro paso a paso y layout privado `/app` ("layout"), con botones de PrimeNG.
- Verificado en Chrome: 23 pasos del recorrido (registro, login, sesión, tema, móvil) y capturas del home en claro, oscuro y móvil.
