# @melodicdev/components

Themeable UI components built on the Melodic Framework.

## Install

```sh
npm install @melodicdev/components @melodicdev/core
```

`@melodicdev/core` is a peer dependency.

---

## Quick Start

### 1. Add the stylesheet

Add a single `<link>` tag to your HTML. It includes design tokens (light + dark themes) and the Phosphor icon fonts — everything the components need to render correctly:

```html
<link melodic-styles rel="stylesheet"
      href="https://unpkg.com/@melodicdev/components/assets/melodic.css">
```

> **Production tip:** Pin to a specific version to avoid unexpected changes:
> ```html
> <link melodic-styles rel="stylesheet"
>       href="https://unpkg.com/@melodicdev/components@1.0.1/assets/melodic.css">
> ```

The `melodic-styles` attribute has no special browser meaning — it's just a convenient selector if you ever need to find or replace the element from JavaScript:

```ts
document.querySelector('link[melodic-styles]').href = '...new-url...';
```

### 2. Apply a theme

Set `data-theme` on `<html>` to activate light or dark mode:

```html
<html data-theme="light">
```

Or use the JS theme API to apply and switch themes dynamically (including system/OS preference):

```ts
import { applyTheme, toggleTheme } from '@melodicdev/components/theme';

applyTheme('light');   // data-theme="light"
applyTheme('dark');    // data-theme="dark"
applyTheme('system');  // follows OS preference, auto-updates
toggleTheme();         // flip between light and dark
```

### 3. Import and use components

```ts
import '@melodicdev/components/button';
import '@melodicdev/components/input';
// etc.
```

```html
<ml-button>Save</ml-button>
<ml-input placeholder="Search..."></ml-input>
```

That's it. No additional setup needed for icons or fonts — they're bundled in `melodic.css`.

---

## Bundler / Framework Setup

If you'd rather serve fonts locally (for offline use, CSP restrictions, etc.) instead of using the CDN, copy the assets from the package:

**Vite:**

```bash
npm install -D vite-plugin-static-copy
```

```ts
// vite.config.ts
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'node_modules/@melodicdev/components/assets', dest: '.' }
      ]
    })
  ]
});
```

Then reference the local copy in your HTML:

```html
<link melodic-styles rel="stylesheet" href="/assets/melodic.css">
```

---

## Icons

The `ml-icon` component uses [Phosphor Icons](https://phosphoricons.com/) via font ligatures. The fonts are included in `melodic.css` — no separate setup needed if you're using the stylesheet above.

```ts
import '@melodicdev/components/icon';
```

```html
<ml-icon icon="house"></ml-icon>
<ml-icon icon="gear" size="lg"></ml-icon>
<ml-icon icon="heart" format="fill"></ml-icon>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `icon` | `string` | `''` | Icon name (ligature). Browse at [phosphoricons.com](https://phosphoricons.com/) |
| `format` | `'regular'` \| `'bold'` \| `'fill'` \| `'light'` \| `'thin'` | `'regular'` | Icon weight/style |
| `size` | `'xs'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` | `'md'` | Icon size (12 / 16 / 24 / 32 / 48px) |

Custom color:

```css
ml-icon {
  --ml-icon-color: var(--ml-color-primary);
}
```

> Duotone icons are not available — the Phosphor duotone font does not support ligatures.

---

## Documentation

### Components
- [**Theming**](./docs/theming.md) — Token system, applying themes, creating custom themes, overriding styles
- [**Forms**](./docs/components/forms.md) — button, button-group, input, textarea, checkbox, radio, radio-card-group, toggle, select, slider, date-picker, form-field
- [**Foundation**](./docs/components/foundation.md) — card, divider, stack, container
- [**Feedback**](./docs/components/feedback.md) — spinner, alert, progress, toast
- [**Data Display**](./docs/components/data-display.md) — avatar, badge, badge-group, tag, list, activity-feed, table, data-grid, calendar-view
- [**Navigation**](./docs/components/navigation.md) — tabs, breadcrumb, pagination, sidebar, steps
- [**Overlays**](./docs/components/overlays.md) — dialog, drawer, popover, dropdown, tooltip
- [**Sections**](./docs/components/sections.md) — app-shell, page-header, hero-section

### Utilities & Helpers
- [**Utilities**](./docs/utilities.md) — positioning, accessibility (focus trap, live regions), virtual scrolling, style utilities
- [**Directives & Functions**](./docs/directives-and-functions.md) — clickOutside, newID, theme functions, design token objects

---

## Naming Conventions

### Elements

All components use kebab-case with the `ml-` prefix:

```
ml-button, ml-input, ml-select, ml-checkbox, ml-data-grid, etc.
```

### Events

All custom events use the `ml:` namespace prefix:

```
ml:click, ml:change, ml:input, ml:open, ml:close, ml:select, ml:sort, etc.
```

Listening in a Melodic template:

```html
<ml-button @ml:click=${this.handleClick}>Save</ml-button>
<ml-input @ml:change=${this.handleChange}></ml-input>
<ml-select @ml:open=${this.onOpen} @ml:close=${this.onClose}></ml-select>
```

---

## Common Types

```ts
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type Placement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';

type ThemeMode = 'light' | 'dark' | 'system';
```

---

## Theme System

Override tokens globally via CSS:

```css
:root {
  --ml-color-primary:       #7c3aed;
  --ml-color-primary-hover: #6d28d9;
  --ml-radius:              0.375rem;
}
```

See [**Theming**](./docs/theming.md) for the full token reference, custom theme creation, dark mode setup, and per-component style overrides.
