import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Tema de PrimeNG con la identidad de Tizzo (docs/BRANDING.md).
 * Los controles (botones, inputs, selects, badges, cards...) SIEMPRE son de PrimeNG; aquí se les da la marca.
 * Los valores con `light-dark(claro, oscuro)` cambian solos con el tema (clase .app-dark).
 *
 * Severidades de botón con significado de marca:
 *  - primary   -> acción principal. Claro: #7B61FF sólido. Oscuro: degradado #B39CFF -> #7C5CFF (regla en tailwind.css).
 *  - warn      -> ACENTO AMARILLO de marca (#FFD23F), ej. "Quiero dar clases". No usarlo para advertencias.
 *  - secondary -> acciones neutras (outlined: "Entrar"; text: links del header).
 * Badge `danger` = indicador "En vivo" (#FF5A5F).
 */
export const TizzoPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f3eeff',
      100: '#e2d6ff',
      200: '#cdbdff',
      300: '#b39cff',
      400: '#9b80ff',
      500: '#7b61ff',
      600: '#6347e6',
      700: '#4f37bf',
      800: '#3a2a8f',
      900: '#2a1f5c',
      950: '#1c1433'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#faf8ff',
          100: '#f3eeff',
          200: '#e2d6ff',
          300: '#cdc3ea',
          400: '#a39bc4',
          500: '#7d76a1',
          600: '#5b5480',
          700: '#463e6e',
          800: '#2a1f5c',
          900: '#21184a',
          950: '#160f33'
        }
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#f3eeff',
          100: '#e2d6ff',
          200: '#c3b2ff',
          300: '#b9aedb',
          400: '#9488bf',
          500: '#6f6499',
          600: '#4f4579',
          700: '#3d3366',
          800: '#2d2356',
          900: '#231a47',
          950: '#1a1330'
        }
      }
    }
  },
  components: {
    button: {
      root: {
        borderRadius: '0.75rem',
        paddingX: '1.125rem',
        paddingY: '0.625rem',
        label: { fontWeight: '600' },
        // Solo colores aquí: light-dark() de CSS no acepta degradados. El degradado del tema oscuro
        // se pinta encima con la regla `.app-dark .p-button` de src/tailwind.css.
        primary: {
          background: 'light-dark({primary.500}, #7c5cff)',
          hoverBackground: 'light-dark({primary.600}, #8b6dff)',
          activeBackground: 'light-dark({primary.700}, #6d4df0)',
          borderColor: 'light-dark({primary.500}, #7c5cff)',
          hoverBorderColor: 'light-dark({primary.600}, #8b6dff)',
          activeBorderColor: 'light-dark({primary.700}, #6d4df0)',
          color: '#ffffff',
          hoverColor: '#ffffff',
          activeColor: '#ffffff',
          focusRing: { color: '{primary.400}', shadow: 'none' }
        },
        // Acento amarillo de marca
        warn: {
          background: '#ffd23f',
          hoverBackground: '#ffc81a',
          activeBackground: '#f5bd00',
          borderColor: '#ffd23f',
          hoverBorderColor: '#ffc81a',
          activeBorderColor: '#f5bd00',
          color: '#2a1f5c',
          hoverColor: '#2a1f5c',
          activeColor: '#2a1f5c',
          focusRing: { color: '#ffd23f', shadow: 'none' }
        }
      },
      outlined: {
        secondary: {
          hoverBackground: 'light-dark({surface.50}, rgba(255,255,255,0.06))',
          activeBackground: 'light-dark({surface.100}, rgba(255,255,255,0.12))',
          borderColor: 'light-dark({surface.300}, {surface.600})',
          color: 'light-dark({surface.800}, {surface.0})'
        }
      },
      text: {
        secondary: {
          hoverBackground: 'light-dark(rgba(123,97,255,0.08), rgba(195,178,255,0.08))',
          activeBackground: 'light-dark(rgba(123,97,255,0.14), rgba(195,178,255,0.14))',
          color: 'light-dark({surface.700}, {surface.200})'
        }
      }
    },
    badge: {
      root: { borderRadius: '999px', padding: '0 0.5rem', fontWeight: '700' },
      danger: { background: '#ff5a5f', color: '#ffffff' }
    },
    // Etiquetas: primary = estado logrado ("Obtenido"), secondary = neutro suave ("En curso", "En 3 días"),
    // warn = acento amarillo para lo urgente ("Vence mañana")
    tag: {
      root: { fontWeight: '600' },
      primary: { background: 'light-dark({primary.500}, #7c5cff)', color: '#ffffff' },
      secondary: { background: 'light-dark({primary.100}, rgba(195,178,255,0.14))', color: 'light-dark({primary.600}, {primary.200})' },
      warn: { background: 'light-dark(#fff1bf, rgba(255,210,63,0.16))', color: 'light-dark(#6b5000, #ffd23f)' }
    },
    card: {
      root: { borderRadius: '1.25rem', shadow: 'none' },
      body: { padding: '1rem', gap: '0.75rem' }
    },
    avatar: {
      root: { fontWeight: '600' }
    }
  }
});
