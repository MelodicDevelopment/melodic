# @melodicdev/components

Themeable UI components built on the Melodic Framework.

## Install

```sh
npm install @melodicdev/components @melodicdev/core
```

`@melodicdev/core` is a peer dependency.

## Usage

Import component modules to register the custom elements.

```ts
import '@melodicdev/components/button';

document.body.innerHTML = `<ml-button>Click me</ml-button>`;
```

## Naming Conventions

### Elements

All components use kebab-case with `ml-` prefix (required by the HTML custom element spec):

```
ml-button, ml-input, ml-select, ml-checkbox, ml-toggle, etc.
```

### Events

All custom events use `ml:` namespace prefix to distinguish them from native DOM events:

```
ml:click, ml:change, ml:input, ml:focus, ml:blur, ml:open, ml:close, ml:dismiss
```

### Listening to Events

```html
<ml-button @ml:click=${this.handleClick}>Click me</ml-button>
<ml-input @ml:change=${this.handleChange}></ml-input>
<ml-select @ml:open=${this.handleOpen} @ml:close=${this.handleClose}></ml-select>
```

This naming convention provides clear visual distinction between Melodic component events (`ml:click`) and native DOM events (`click`).

---

## Icons

The `ml-icon` component displays icons using [Phosphor Icons](https://phosphoricons.com/) via font ligatures.

### Setup

1. Copy the font assets to your public directory. With Vite, use `vite-plugin-static-copy`:

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
        {
          src: 'node_modules/@melodicdev/components/assets/*',
          dest: 'public'
        }
      ]
    })
  ]
});
```

2. Add the font stylesheet to your HTML:

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

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `icon` | `string` | `''` | Icon name (ligature). Browse icons at [phosphoricons.com](https://phosphoricons.com/) |
| `format` | `'regular'` \| `'bold'` \| `'fill'` \| `'light'` \| `'thin'` | `'regular'` | Icon weight/style |

> **Note:** Duotone icons are not available. The Phosphor duotone font does not support ligatures.

### Sizes

Set via the `size` attribute:

| Size | Value |
|------|-------|
| `xs` | 12px |
| `sm` | 16px |
| `md` | 24px (default) |
| `lg` | 32px |
| `xl` | 48px |

### Custom Color

Icons inherit `currentColor` by default. Override with CSS:

```css
ml-icon {
  --ml-icon-color: var(--ml-color-primary);
}
```

### Finding Icon Names

Visit [phosphoricons.com](https://phosphoricons.com/) to browse all available icons. The icon name shown on the site is the ligature value you pass to the `icon` property.

---

## Theme System (Tokens + CSS)

Components use CSS custom property tokens (`--ml-*`) for consistent theming. Tokens are grouped by domain (colors, spacing, typography, shadows, borders, transitions, breakpoints). Component styles reference semantic tokens like `--ml-color-text` or `--ml-space-3` instead of raw values.

### Token Structure

Tokens are grouped by domain:
- Colors (primitive + semantic)
- Spacing
- Typography
- Shadows
- Borders
- Transitions
- Breakpoints

Source of truth:
- `packages/melodic-components/src/theme/tokens/colors.tokens.ts`
- `packages/melodic-components/src/theme/tokens/spacing.tokens.ts`
- `packages/melodic-components/src/theme/tokens/typography.tokens.ts`
- `packages/melodic-components/src/theme/tokens/shadows.tokens.ts`
- `packages/melodic-components/src/theme/tokens/borders.tokens.ts`
- `packages/melodic-components/src/theme/tokens/transitions.tokens.ts`
- `packages/melodic-components/src/theme/tokens/breakpoints.tokens.ts`

Tokens are combined in `packages/melodic-components/src/theme/tokens/all-tokens.ts`.

### Theme Presets

The preset CSS strings live here:
- Base (all tokens applied to `:root`): `packages/melodic-components/src/theme/presets/base.preset.ts`
- Light overrides: `packages/melodic-components/src/theme/presets/light.preset.ts`
- Dark overrides: `packages/melodic-components/src/theme/presets/dark.preset.ts`

The dark preset also supports `prefers-color-scheme: dark` when `data-theme="light"` is not set.

### Load Base + Presets

```ts
import { baseThemeCss, lightThemeCss, darkThemeCss } from '@melodicdev/components/theme';

const style = document.createElement('style');
style.textContent = `${baseThemeCss}\n${lightThemeCss}\n${darkThemeCss}`;
document.head.appendChild(style);
```

### Switch Themes

```ts
import { applyTheme } from '@melodicdev/components/theme';

applyTheme('dark'); // 'light' | 'dark' | 'system'
```

`system` follows the OS preference and updates on changes.

### Custom Themes

```ts
import { createTheme } from '@melodicdev/components/theme';

const brandCss = createTheme('brand', {
	'--ml-color-primary': '#4a6cff',
	'--ml-radius': '10px'
});

const style = document.createElement('style');
style.textContent = brandCss;
document.head.appendChild(style);

document.documentElement.setAttribute('data-theme', 'brand');
```

### Brand Theme Helper

`createBrandTheme` is a convenience helper for overriding semantic brand colors.

```ts
import { createBrandTheme } from '@melodicdev/components/theme';

const brandCss = createBrandTheme('brand', {
	primary: '#4a6cff',
	secondary: '#6b7280'
});
```

### Token Usage in CSS

```css
.ml-card {
	background: var(--ml-color-surface);
	color: var(--ml-color-text);
	border-radius: var(--ml-radius);
	box-shadow: var(--ml-shadow-sm);
	padding: var(--ml-space-4);
}
```

### Breakpoints

```ts
import { breakpoints } from '@melodicdev/components/theme';

if (window.innerWidth >= breakpoints.lg) {
	// Large screen logic
}
```

In CSS:

```css
@media (min-width: var(--ml-screen-lg)) {
	.ml-layout {
		padding: var(--ml-space-8);
	}
}
```
