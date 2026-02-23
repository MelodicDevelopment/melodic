# Theming

Melodic Components uses a CSS custom property (CSS variable) token system. All component styles reference semantic tokens like `--ml-color-primary` or `--ml-space-4` rather than hardcoded values, making the entire library themeable from one place.

---

## Loading Styles

The package ships a pre-built `melodic-components.css` that includes design tokens (light + dark themes) and the Phosphor icon fonts. It's the recommended way to get styles into any app.

### Via CDN (recommended)

```html
<link melodic-styles rel="stylesheet"
      href="https://unpkg.com/@melodicdev/components/assets/melodic-components.css">
```

Pin to a specific version and use the minified build in production:

```html
<link melodic-styles rel="stylesheet"
      href="https://unpkg.com/@melodicdev/components@1.0.1/assets/melodic-components.min.css">
```

The `melodic-styles` attribute has no special browser meaning. It's a handy selector for finding the element from JS if you need to swap it out at runtime:

```ts
document.querySelector('link[melodic-styles]').href = '/assets/melodic-components.css';
```

### Via bundler (local assets)

Copy the `assets/` folder from the package to your public directory and reference it locally. With Vite:

```bash
npm install -D vite-plugin-static-copy
```

```ts
// vite.config.ts
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [{ src: 'node_modules/@melodicdev/components/assets', dest: '.' }]
    })
  ]
});
```

```html
<link melodic-styles rel="stylesheet" href="/assets/melodic-components.css">
```

### Via JS (dynamic / no HTML access)

If you can't add a `<link>` tag (e.g., a fully JS-rendered environment), import the raw CSS strings and inject them:

```ts
import { baseThemeCss, lightThemeCss, darkThemeCss } from '@melodicdev/components/theme';

const style = document.createElement('style');
style.textContent = `${baseThemeCss}\n${lightThemeCss}\n${darkThemeCss}`;
document.head.appendChild(style);
```

> Note: The JS approach does not include Phosphor icon fonts. Import `@melodicdev/components/icon` and ensure fonts are served separately if you use `ml-icon`.

---

## Applying a Theme

Once the stylesheet is loaded, activate a theme by setting `data-theme` on `<html>`:

```html
<html data-theme="light">
```

Or use the `applyTheme` API — it sets `data-theme` on `<html>` for you:

```ts
import { applyTheme } from '@melodicdev/components/theme';

applyTheme('light');   // sets data-theme="light"
applyTheme('dark');    // sets data-theme="dark"
applyTheme('system');  // follows OS preference, auto-updates on change
```

---

## Theme API

```ts
import {
  applyTheme,
  getTheme,
  getResolvedTheme,
  toggleTheme,
  onThemeChange,
  createTheme,
  injectTheme,
  createBrandTheme
} from '@melodicdev/components/theme';
```

| Function | Description |
|----------|-------------|
| `applyTheme(mode)` | Apply `'light'`, `'dark'`, or `'system'` |
| `getTheme()` | Returns the currently set mode string |
| `getResolvedTheme()` | Returns `'light'` or `'dark'` (resolves `'system'`) |
| `toggleTheme()` | Flip between light and dark |
| `onThemeChange(fn)` | Subscribe to theme changes; returns an unsubscribe function |
| `createTheme(name, overrides)` | Build a CSS string for a custom theme (does not inject it) |
| `injectTheme(name, overrides)` | Build and inject the theme into `<head>` automatically |
| `createBrandTheme(name, colors)` | Convenience wrapper for overriding brand colors |

---

## Token Structure

Tokens are split into two layers: **primitive** (raw values) and **semantic** (meaning-mapped aliases).

### Colors

```css
/* Primitives — raw palette */
--ml-blue-600: #155eef;
--ml-gray-900: #101828;

/* Semantic — use these in component overrides */
--ml-color-primary:          /* maps to --ml-blue-600    */
--ml-color-primary-hover:    /* maps to --ml-blue-700    */
--ml-color-primary-subtle:   /* maps to --ml-blue-50     */
--ml-color-secondary:
--ml-color-success:
--ml-color-warning:
--ml-color-danger:
--ml-color-info:

/* Surfaces */
--ml-color-background:
--ml-color-surface:
--ml-color-surface-raised:
--ml-color-surface-overlay:
--ml-color-surface-sunken:

/* Text */
--ml-color-text:
--ml-color-text-secondary:
--ml-color-text-muted:
--ml-color-text-inverse:
--ml-color-text-link:

/* Borders */
--ml-color-border:
--ml-color-border-strong:
--ml-color-border-focus:

/* Focus ring */
--ml-color-focus-ring:
--ml-focus-ring-width:  /* default: 4px */
--ml-focus-ring-offset: /* default: 1px */
```

### Spacing

Based on a 4px (0.25rem) scale:

```css
--ml-space-1:   0.25rem  /* 4px  */
--ml-space-2:   0.5rem   /* 8px  */
--ml-space-3:   0.75rem  /* 12px */
--ml-space-4:   1rem     /* 16px */
--ml-space-5:   1.25rem  /* 20px */
--ml-space-6:   1.5rem   /* 24px */
--ml-space-8:   2rem     /* 32px */
--ml-space-10:  2.5rem   /* 40px */
--ml-space-12:  3rem     /* 48px */
/* ... up to --ml-space-96 */
```

### Typography

```css
--ml-font-sans:        /* system UI font stack */
--ml-font-mono:        /* monospace stack */

--ml-text-xs:    0.75rem
--ml-text-sm:    0.875rem
--ml-text-md:    1rem
--ml-text-lg:    1.125rem
--ml-text-xl:    1.25rem
--ml-text-2xl:   1.5rem

--ml-font-regular:  400
--ml-font-medium:   500
--ml-font-semibold: 600
--ml-font-bold:     700

--ml-leading-tight:  1.25
--ml-leading-normal: 1.5
```

### Borders & Radius

```css
--ml-border:       1px solid     /* default border width+style */
--ml-radius-sm:    0.375rem
--ml-radius:       0.5rem        /* default */
--ml-radius-md:    0.625rem
--ml-radius-lg:    0.75rem
--ml-radius-xl:    1rem
--ml-radius-full:  9999px
```

### Shadows

```css
--ml-shadow-xs:
--ml-shadow-sm:
--ml-shadow-md:
--ml-shadow-lg:
--ml-shadow-xl:
```

### Transitions

```css
--ml-duration-100: 100ms
--ml-duration-150: 150ms
--ml-duration-200: 200ms
--ml-duration-300: 300ms
--ml-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ml-ease-out:    cubic-bezier(0, 0, 0.2, 1)
```

---

## Overriding Tokens (Quick Customization)

The simplest customization is overriding tokens on `:root`. This affects every component:

```css
:root {
  /* Change the primary brand color */
  --ml-color-primary:       #7c3aed;
  --ml-color-primary-hover: #6d28d9;
  --ml-color-primary-subtle: #ede9fe;

  /* Tighten the border radius */
  --ml-radius:    0.25rem;
  --ml-radius-lg: 0.375rem;

  /* Change the default font */
  --ml-font-sans: 'Inter', sans-serif;
}
```

Because all components reference these variables, every button, input, card, etc. will update automatically.

---

## Creating a Custom Theme

A "custom theme" is just a set of CSS variable overrides that get applied when your theme name is active. Here's how to create and activate one from scratch.

### Step 1 — Choose your token values

Decide which tokens you want to change. You don't need to specify everything — only what differs from the defaults. Common starting points:

| What you want to change | Token(s) to override |
|-------------------------|----------------------|
| Primary button/link color | `--ml-color-primary`, `--ml-color-primary-hover`, `--ml-color-primary-subtle` |
| Corner rounding | `--ml-radius`, `--ml-radius-lg`, `--ml-radius-full` |
| Font family | `--ml-font-sans` |
| Page background | `--ml-color-background`, `--ml-color-surface` |
| Body text color | `--ml-color-text`, `--ml-color-text-secondary` |

### Step 2 — Inject the theme CSS

Call `injectTheme` with a name and your overrides. This writes a `<style>` block into `<head>` scoped to `[data-theme="your-name"]`:

```ts
import { injectTheme } from '@melodicdev/components/theme';

injectTheme('brand', {
  '--ml-color-primary':        '#7c3aed',
  '--ml-color-primary-hover':  '#6d28d9',
  '--ml-color-primary-subtle': '#ede9fe',
  '--ml-radius':               '0.375rem',
  '--ml-font-sans':            "'Inter', sans-serif",
});
```

### Step 3 — Activate it

`injectTheme` only writes the CSS — it doesn't switch anything on yet. Activate your theme by setting `data-theme` on the `<html>` element:

```ts
document.documentElement.setAttribute('data-theme', 'brand');
```

> **Important:** Do not call `applyTheme()` after this. `applyTheme` is for the built-in `'light'`/`'dark'`/`'system'` modes and would immediately overwrite your `data-theme`, deactivating your custom theme.

That's it. Every `ml-*` component on the page now uses your token overrides.

### Step 4 (optional) — Add dark mode support

If you want your custom theme to respond to the OS dark mode preference, add a `@media` block to your global CSS file:

```css
@media (prefers-color-scheme: dark) {
  [data-theme='brand'] {
    --ml-color-primary:        #a78bfa;
    --ml-color-primary-hover:  #7c3aed;
    --ml-color-primary-subtle: #2e1065;
    --ml-color-background:     #0f0f0f;
    --ml-color-surface:        #1a1a1a;
    --ml-color-text:           #f3f4f6;
    --ml-color-border:         #374151;
  }
}
```

---

## Brand Theme Helper

`createBrandTheme` is a convenience that maps simple color names to the right semantic tokens (including hover/subtle/active variants):

```ts
import { createBrandTheme } from '@melodicdev/components/theme';

const css = createBrandTheme('brand', {
  primary:   '#7c3aed',
  secondary: '#6b7280',
  // success, warning, danger, info are also accepted
});

const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);
document.documentElement.setAttribute('data-theme', 'brand');
```

---

## Dark Mode

The dark preset activates two ways:

1. **Explicit** — when `data-theme="dark"` is on `<html>`
2. **Automatic** — via `prefers-color-scheme: dark` (when `data-theme="light"` is NOT set)

To add dark overrides to your custom theme:

```ts
injectTheme('brand', {
  // Light-mode tokens
  '--ml-color-primary': '#7c3aed',
});

// Then in CSS (or another injectTheme call scoped to a media query)
const darkCss = `
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      --ml-color-primary: #a78bfa;
      --ml-color-background: #0f0f0f;
      --ml-color-surface: #1a1a1a;
      --ml-color-text: #f3f4f6;
    }
  }
`;
```

Or use the `onThemeChange` API to reactively swap token values:

```ts
import { onThemeChange } from '@melodicdev/components/theme';

onThemeChange((mode) => {
  document.documentElement.style.setProperty(
    '--my-custom-var',
    mode === 'dark' ? '#1a1a2e' : '#ffffff'
  );
});
```

---

## Modifying Individual Component Styles

All components use Shadow DOM. To style internals you have two options:

### Option 1 — Override CSS custom properties

Every component exposes design tokens. Override them on the host element or a parent:

```css
/* All buttons site-wide */
ml-button {
  --ml-color-primary: hotpink;
  --ml-radius: 999px; /* pill buttons */
}

/* A specific card */
.my-special-card {
  --ml-shadow-md: 0 8px 32px rgba(0,0,0,0.2);
  --ml-radius-lg: 1.5rem;
}
```

### Option 2 — Style the host element directly

Components set `display: block` on `:host`. You can override sizing and layout from outside:

```css
ml-button {
  width: 100%;
}

ml-card {
  max-width: 400px;
}
```

### Component-specific tokens

Some components expose their own tokens:

```css
ml-icon {
  --ml-icon-color: var(--ml-color-primary);
}

ml-tooltip {
  --ml-tooltip-bg: #1e1b4b;
  --ml-tooltip-text: #ffffff;
}
```

---

## Complete Theme Example

A full "Violet" brand theme with built-in light/dark support. Because this is a named theme, `applyTheme` is not used — light and dark overrides are embedded in the CSS directly:

```ts
import { injectTheme } from '@melodicdev/components/theme';

// Light-mode violet tokens
injectTheme('violet', {
  '--ml-color-primary':          '#7c3aed',
  '--ml-color-primary-hover':    '#6d28d9',
  '--ml-color-primary-active':   '#5b21b6',
  '--ml-color-primary-subtle':   '#ede9fe',
  '--ml-font-sans':              "'Inter', system-ui, sans-serif",
  '--ml-radius':                 '0.375rem',
  '--ml-radius-lg':              '0.5rem',
  '--ml-radius-full':            '9999px',
});

// Activate — do NOT also call applyTheme(), it would overwrite this attribute
document.documentElement.setAttribute('data-theme', 'violet');
```

```css
/* In your global CSS — dark overrides scoped to the violet theme */
@media (prefers-color-scheme: dark) {
  [data-theme='violet'] {
    --ml-color-primary:         #a78bfa;
    --ml-color-primary-hover:   #7c3aed;
    --ml-color-primary-subtle:  #2e1065;
    --ml-color-background:      #0f0a1e;
    --ml-color-surface:         #1a1130;
    --ml-color-surface-sunken:  #120d24;
    --ml-color-text:            #f5f3ff;
    --ml-color-border:          #3b2f6b;
  }
}
```

If you want to layer a custom brand theme on top of the built-in light/dark switching, the cleanest approach is to override tokens on `:root` (see [Overriding Tokens](#overriding-tokens-quick-customization)) rather than using a named theme — `applyTheme` will then correctly control `data-theme` without conflicting.

---

## Breakpoints

```ts
import { breakpoints } from '@melodicdev/components/theme';

// { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }
if (window.innerWidth >= breakpoints.lg) { /* ... */ }
```

In CSS:

```css
@media (min-width: var(--ml-screen-lg)) {
  .layout { padding: var(--ml-space-8); }
}
```

Available screen tokens: `--ml-screen-sm`, `--ml-screen-md`, `--ml-screen-lg`, `--ml-screen-xl`, `--ml-screen-2xl`.
