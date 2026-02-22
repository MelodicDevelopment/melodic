# Directives & Functions

Standalone helpers for DOM event handling and ID generation.

---

## Directives

There are two separate directive entry points:

| Import path | What it exports |
|-------------|-----------------|
| `@melodicdev/components/utils` | `clickOutside`, `createClickOutsideHandler` — imperative DOM helpers |
| `@melodicdev/components/directives` | `tooltipDirective` — declarative attribute directive for the Melodic template engine |

---

### `clickOutside` / `createClickOutsideHandler`

```ts
import { clickOutside, createClickOutsideHandler } from '@melodicdev/components/utils';
```

### `clickOutside(element, callback)`

Listen for clicks anywhere **outside** a given element. Uses the capture phase so it fires before any component internal handlers.

Returns a cleanup function — call it to remove the listener.

```ts
const cleanup = clickOutside(dropdownEl, (event) => {
  dropdown.close();
});

// Later (e.g. when the component is destroyed):
cleanup();
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `element` | `HTMLElement` | The element whose boundary to watch |
| `callback` | `(event: MouseEvent) => void` | Called when a click lands outside |

**Returns:** `() => void` — cleanup function

---

### `createClickOutsideHandler(callback)`

Factory variant — returns a function that accepts an element. Useful with Melodic template directives where the element is passed in during rendering.

```ts
import { createClickOutsideHandler } from '@melodicdev/components/utils';

// In a Melodic template
const outsideHandler = createClickOutsideHandler(() => this.closeMenu());

// template:
html`<div ${outsideHandler}>...</div>`
```

The returned per-element function also returns a cleanup function.

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `(event: MouseEvent) => void` | Called on outside click |

**Returns:** `(element: HTMLElement) => () => void`

---

### `tooltipDirective`

```ts
import { tooltipDirective } from '@melodicdev/components/directives';
import type { TooltipDirectiveOptions } from '@melodicdev/components/directives';
```

An **attribute directive** for the Melodic template engine that wraps any element with an `ml-tooltip` component automatically. Register it once; use `:tooltip` as an HTML attribute anywhere in your templates.

```html
<!-- Simple string -->
<ml-icon icon="info" :tooltip="More information"></ml-icon>

<!-- With placement -->
<ml-button :tooltip=${{ content: 'Save changes', placement: 'bottom' }}>Save</ml-button>

<!-- Dynamic content -->
<span :tooltip=${this.helpText}>Hover me</span>
```

The directive is registered globally via `registerAttributeDirective` when the module is imported — no further setup required.

| `TooltipDirectiveOptions` | Type | Default | Description |
|---------------------------|------|---------|-------------|
| `content` | `string` | — | Tooltip text |
| `placement` | `string` | `'top'` | Preferred placement (any `Placement` value) |

Passing a plain `string` is shorthand for `{ content: string }`.

---

## Functions

```ts
import { newID } from '@melodicdev/components/functions';
// or
import { newID } from '@melodicdev/components';
```

### `newID()`

Generate a random UUID v4 string branded as `UniqueID`. Use it to create stable, unique IDs for accessibility attributes (`id`, `aria-labelledby`, `htmlFor`, etc.).

```ts
import { newID } from '@melodicdev/components/functions';

const id = newID();
// 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
```

**Returns:** `UniqueID` (a branded `string`)

Because `UniqueID` is a branded type, TypeScript distinguishes it from plain strings at the type level — you can always assign it where a `string` is expected.

---

## Theme Functions

```ts
import {
  applyTheme,
  toggleTheme,
  getTheme,
  getResolvedTheme,
  onThemeChange,
  createTheme,
  injectTheme,
  createBrandTheme,
} from '@melodicdev/components/theme';
```

See the [Theming](./theming.md) docs for full usage. Quick reference:

| Function | Description |
|----------|-------------|
| `applyTheme(mode)` | Set `'light'`, `'dark'`, or `'system'`; writes `data-theme` on `<html>` |
| `toggleTheme()` | Flip between light and dark |
| `getTheme()` | Return the currently set mode string |
| `getResolvedTheme()` | Return `'light'` or `'dark'` (resolves `'system'` against OS preference) |
| `onThemeChange(fn)` | Subscribe to mode changes; returns an unsubscribe function |
| `createTheme(name, overrides)` | Build a CSS string for a named theme without injecting it |
| `injectTheme(name, overrides)` | Build and inject the theme `<style>` into `<head>` |
| `createBrandTheme(name, colors)` | Convenience wrapper: maps `primary`/`secondary`/`success`/`warning`/`danger` colors to all their semantic token variants |

---

## Token Exports

Design token objects for use in JavaScript (e.g. matching a breakpoint or reading a spacing value).

```ts
import {
  colorTokens,
  primitiveColors,
  spacingTokens,
  typographyTokens,
  shadowTokens,
  borderTokens,
  transitionTokens,
  breakpointTokens,
  breakpoints,
  allTokens,
  tokensToCss,
} from '@melodicdev/components/theme';

import type { Breakpoint } from '@melodicdev/components/theme';
```

| Export | Type | Description |
|--------|------|-------------|
| `colorTokens` | `object` | Semantic color tokens (`--ml-color-primary`, etc.) |
| `primitiveColors` | `object` | Raw palette (`--ml-blue-600`, etc.) |
| `spacingTokens` | `object` | Spacing scale (`--ml-space-1` … `--ml-space-96`) |
| `typographyTokens` | `object` | Font family, size, weight, and line-height tokens |
| `shadowTokens` | `object` | Box-shadow tokens |
| `borderTokens` | `object` | Border radius and width tokens |
| `transitionTokens` | `object` | Duration and easing tokens |
| `breakpointTokens` | `object` | CSS variable breakpoints (`--ml-screen-sm`, etc.) |
| `breakpoints` | `object` | Numeric breakpoints for JS comparisons |
| `allTokens` | `object` | All of the above merged |
| `tokensToCss()` | `() => string` | Convert `allTokens` to a CSS custom property block |

### `breakpoints` example

```ts
import { breakpoints } from '@melodicdev/components/theme';
import type { Breakpoint } from '@melodicdev/components/theme';

// { xs: 320, sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }

if (window.innerWidth >= breakpoints.lg) {
  // desktop layout
}

function isAbove(bp: Breakpoint): boolean {
  return window.innerWidth >= breakpoints[bp];
}
```

### `tokensToCss()` example

```ts
import { tokensToCss } from '@melodicdev/components/theme';

const style = document.createElement('style');
style.textContent = tokensToCss();
document.head.appendChild(style);
```

### Theme preset CSS strings

For manual injection (e.g. SSR or non-Vite builds):

```ts
import { baseThemeCss, lightThemeCss, darkThemeCss } from '@melodicdev/components/theme';

const style = document.createElement('style');
style.textContent = `${baseThemeCss}\n${lightThemeCss}\n${darkThemeCss}`;
document.head.appendChild(style);
```
