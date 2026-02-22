# @melodicdev/components

Themeable UI components built on the Melodic Framework.

## Install

```sh
npm install @melodicdev/components @melodicdev/core
```

`@melodicdev/core` is a peer dependency.

## Usage

Import a component module to register its custom element, then use it in HTML:

```ts
import '@melodicdev/components/button';

document.body.innerHTML = `<ml-button>Click me</ml-button>`;
```

## Documentation

- [**Theming**](./docs/theming.md) — Token system, applying themes, creating custom themes, overriding styles
- [**Forms**](./docs/components/forms.md) — button, button-group, input, textarea, checkbox, radio, radio-card-group, toggle, select, slider, date-picker, form-field
- [**Foundation**](./docs/components/foundation.md) — card, divider, stack, container
- [**Feedback**](./docs/components/feedback.md) — spinner, alert, progress, toast
- [**Data Display**](./docs/components/data-display.md) — avatar, badge, badge-group, tag, list, activity-feed, table, data-grid, calendar-view
- [**Navigation**](./docs/components/navigation.md) — tabs, breadcrumb, pagination, sidebar, steps
- [**Overlays**](./docs/components/overlays.md) — dialog, drawer, popover, dropdown, tooltip
- [**Sections**](./docs/components/sections.md) — app-shell, page-header, hero-section

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

## Icons

The `ml-icon` component displays icons using [Phosphor Icons](https://phosphoricons.com/) via font ligatures.

### Setup

Copy the font assets to your public directory. With Vite, use `vite-plugin-static-copy`:

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
        { src: 'node_modules/@melodicdev/components/assets/*', dest: 'public' }
      ]
    })
  ]
});
```

Add the font stylesheet to your HTML:

```html
<link rel="stylesheet" href="/public/fonts/phosphor/phosphor.css" />
```

### Usage

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

Apply a built-in theme:

```ts
import { applyTheme } from '@melodicdev/components/theme';

applyTheme('light');   // or 'dark' or 'system'
```

Override tokens globally via CSS:

```css
:root {
  --ml-color-primary:       #7c3aed;
  --ml-color-primary-hover: #6d28d9;
  --ml-radius:              0.375rem;
}
```

See [**Theming**](./docs/theming.md) for the full token reference, custom theme creation, dark mode setup, and per-component style overrides.
