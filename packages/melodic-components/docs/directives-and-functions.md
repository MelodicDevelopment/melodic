# Directives & Functions

Standalone helpers for DOM event handling, slot detection and ID generation.

---

## Directives

There are two separate directive entry points:

| Import path | What it exports |
|-------------|-----------------|
| `@melodicdev/components/utils` | `clickOutside`, `watchLightSlots`, `hasLightSlot` — imperative DOM helpers |
| `@melodicdev/components/directives` | `tooltipDirective` — declarative attribute directive for the Melodic template engine |

`watchLightSlots` and `hasLightSlot` are covered in [Utilities](./utilities.md#watching-light-dom-slots). The `directives` entry point is not re-exported from the package root, so import it by its own path.

---

### `clickOutside`

```ts
import { clickOutside } from '@melodicdev/components/utils';
```

### `clickOutside(element, callback)`

Listen for clicks anywhere **outside** a given element. Uses the capture phase on `document` so it fires before any component internal handlers, and checks the event's composed path, so a click inside shadow-hosted content of the element counts as inside.

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

### `tooltipDirective`

```ts
import { tooltipDirective } from '@melodicdev/components/directives';
import type { TooltipDirectiveOptions } from '@melodicdev/components/directives';
```

An **attribute directive** for the Melodic template engine that attaches an `ml-tooltip` to any element. Import the module once; use `:tooltip` as an HTML attribute anywhere in your templates.

```html
<!-- Simple string -->
<ml-icon icon="info" :tooltip="More information"></ml-icon>

<!-- With placement -->
<ml-button :tooltip=${{ content: 'Save changes', placement: 'bottom' }}>Save</ml-button>

<!-- Dynamic content -->
<span :tooltip=${this.helpText}>Hover me</span>
```

The directive is registered globally via `registerAttributeDirective` when the module is imported — no further setup required. Importing it also registers the `ml-tooltip` element.

The element is never wrapped or reparented: the directive inserts a slotless `ml-tooltip` as the element's next sibling (taken out of layout flow) and anchors its popup to the element. It shows on `mouseenter`/`focusin` and hides on `mouseleave`/`focusout`, and the element is described by the tooltip content for assistive technology unless it already has its own `aria-describedby`. A falsy value or empty `content` attaches no tooltip. When the value changes on re-render the existing tooltip is updated in place; it is removed when the element leaves the template.

| `TooltipDirectiveOptions` | Type | Default | Description |
|---------------------------|------|---------|-------------|
| `content` | `string` | — | Tooltip text |
| `placement` | `string` | `'top'` | Preferred placement (any `Placement` value) |

Passing a plain `string` is shorthand for `{ content: string }`.

---

## Functions

```ts
import { newID, watchSlotPresence } from '@melodicdev/components/functions';
import type { UniqueID } from '@melodicdev/components/functions';
// or
import { newID, watchSlotPresence } from '@melodicdev/components';
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

### `watchSlotPresence(shadow, onChange)`

Report whether each `<slot>` in a shadow root has slotted content — once immediately, and again on every `slotchange` — so a component can show or hide wrappers around optional slots as content is added or removed after mount.

```ts
import { watchSlotPresence } from '@melodicdev/components/functions';

public onCreate(): void {
  watchSlotPresence(this.elementRef.shadowRoot!, (name, hasContent) => {
    if (name === 'footer') this.hasFooter = hasContent;
  });
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `shadow` | `ShadowRoot` | The shadow root whose slots to watch |
| `onChange` | `(slotName: string, hasContent: boolean) => void` | Called per slot; `slotName` is `''` for the default slot |

**Returns:** `void`

Whitespace-only text does not count as content. Only slots present in the shadow root at the time of the call are watched; for a slot that is rendered conditionally, use `watchLightSlots` from `@melodicdev/components/utils` instead (see [Utilities](./utilities.md#watching-light-dom-slots)).

### Deprecation helpers

The same entry point exports the helpers the library's own components use to announce deprecated API.

| Function | Description |
|----------|-------------|
| `warnDeprecatedOnce(key, message)` | `console.warn(message)` once per `key` for the page's lifetime |
| `warnDeprecatedTitleOnce(tag, replacement)` | One-time warning that `tag`'s `title` attribute/property is deprecated in favour of `replacement` |
| `defineLegacyAliases(proto, tag, aliases)` | Define deprecated quoted kebab-case property aliases on a prototype (`{ 'dot-color': 'dotColor' }`) that forward to the camelCase property and warn once when set |

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
| `applyTheme(mode)` | Set `'light'`, `'dark'`, or `'system'`; writes the resolved `'light'`/`'dark'` to `data-theme` on `<html>` |
| `toggleTheme()` | Flip between light and dark |
| `getTheme()` | Return the currently set mode string (adopts the document's `data-theme` before the first `applyTheme()`) |
| `getResolvedTheme()` | Return `'light'` or `'dark'` (resolves `'system'` against OS preference) |
| `onThemeChange(fn)` | Subscribe to mode changes with `fn(mode, resolved)`; returns an unsubscribe function |
| `createTheme(name, overrides)` | Build a CSS string for a named theme without injecting it |
| `injectTheme(name, overrides)` | Build and inject the theme `<style>` into `<head>`; returns the `<style>` element |
| `createBrandTheme(name, options)` | Convenience wrapper: maps `primary`/`secondary`/`success`/`warning`/`danger` colors to the base token plus its `-hover`/`-active`/`-subtle` variants (`mode: 'light' \| 'dark'`). Returns a CSS string |

Types: `ThemeMode` (`'light' | 'dark' | 'system'`) and `BrandThemeMode` (`'light' | 'dark'`).

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
| `colorTokens` | `object` | Semantic color tokens (`--ml-color-primary`, etc.), plus the themed badge, alert, tooltip and card-footer colors |
| `primitiveColors` | `object` | Raw palette (`--ml-blue-600`, etc.) |
| `spacingTokens` | `object` | Spacing scale (`--ml-space-1` … `--ml-space-96`) |
| `typographyTokens` | `object` | Font family, size, weight, line-height, and letter-spacing tokens |
| `shadowTokens` | `object` | Box-shadow tokens |
| `borderTokens` | `object` | Border radius and width tokens |
| `transitionTokens` | `object` | Duration and easing tokens |
| `breakpointTokens` | `object` | CSS variable breakpoints (`--ml-screen-sm`, etc.) |
| `breakpoints` | `object` | Numeric breakpoints for JS comparisons |
| `allTokens` | `object` | All of the token objects above merged (not the numeric `breakpoints`) |
| `tokensToCss(tokens)` | `(tokens: Record<string, string>) => string` | Convert a tokens object to CSS declarations (`--name: value;` per line, no selector) |

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

`tokensToCss` returns declarations only, so wrap them in a selector yourself:

```ts
import { allTokens, tokensToCss } from '@melodicdev/components/theme';

const style = document.createElement('style');
style.textContent = `:root { ${tokensToCss(allTokens)} }`;
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

The presets are also exported as objects, `lightTheme` and `darkTheme`: the token overrides each preset applies (`{ '--ml-color-background': 'var(--ml-gray-950)', … }`), in the same shape as the token objects above.
