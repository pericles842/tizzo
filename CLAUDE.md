# tizzo (frontend)

Frontend de Tizzo. Contexto general en `../CLAUDE.md` y `../docs/`.

## Stack (instalado y configurado)

- Angular 20 con SSR, componentes standalone, signals y zoneless.
- **Tailwind CSS 4** vía PostCSS (`.postcssrc.json`) + `tailwindcss-primeui`.
- **PrimeNG 20** + `@primeuix/themes` + `primeicons` + `@angular/animations`.
- **No usar** Spartan UI ni PrimeFlex.
- Sass para estilos de componentes (`src/styles.sass`, `*.sass`).

> PrimeNG está fijado en la versión 20 porque PrimeNG 21+ exige Angular 22. No actualizar PrimeNG sin actualizar Angular.

## Cómo está armado el estilo

- `angular.json` carga, en orden: `primeicons.css`, `src/tailwind.css` y `src/styles.sass`.
- `src/tailwind.css`: `@import 'tailwindcss'`, el plugin de PrimeNG, el `@custom-variant dark` y los **tokens de marca** en `@theme` (`cloud-*`, `night-*`, `accent`, `live`, fuentes `font-sans` Inter y `font-display` Poppins).
- `src/app/tizzo.preset.ts`: preset de PrimeNG (Aura) con paleta primaria centrada en `#7B61FF`.
- `src/app/app.config.ts`: `providePrimeNG` con `darkModeSelector: '.app-dark'` y `cssLayer`. El modo oscuro se activa poniendo la clase `app-dark` en `<html>`; Tailwind y PrimeNG la comparten.

## Reglas

- Colores y temas en `../docs/BRANDING.md`. Usar los tokens (`bg-cloud-primary`, `text-night-subtitle`, etc.), no hex sueltos.
- Tipografía Poppins (títulos) e Inter (textos) es provisional.
- Soportar tema claro y oscuro.
- Las pantallas se organizan por actor: estudiante, profe, admin.
- No asumir la pasarela de pagos ni el proveedor de videollamadas: están por definir (`../docs/DECISIONES.md`).

## Estado

Sin pantallas todavía; `app.html` sigue siendo el del scaffold. `ng build` compila correctamente.
