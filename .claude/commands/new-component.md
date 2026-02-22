# New Component

Scaffold a new Melodic UI component following all established patterns, then wire it into the demo app.

## Instructions

Ask the user for:
1. **Component name** — kebab-case without the `ml-` prefix (e.g. `stat-card`, `color-picker`)
2. **Category** — one of: `forms`, `feedback`, `foundation`, `data-display`, `navigation`, `overlays`, `sections`, `general`

Then perform the following steps in order:

---

### Step 1 — Create component files

Create these four files in `packages/melodic-components/src/components/<category>/<name>/`:

**`<name>.component.ts`**
```typescript
import { MelodicComponent } from '@melodicdev/core';
import { <PascalName>Template } from './<name>.template.js';
import { <PascalName>Styles } from './<name>.styles.js';

/**
 * ml-<name> - Brief description
 *
 * @example
 * <ml-<name>></ml-<name>>
 */
@MelodicComponent({
  selector: 'ml-<name>',
  template: <PascalName>Template,
  styles: <PascalName>Styles,
  attributes: []
})
export class <PascalName>Component {
  // Public reactive properties go here (no _ prefix)

  // Private non-reactive fields use _ prefix
  // private _cleanup: (() => void) | null = null;

  onCreate(): void { }
  onDestroy(): void { }
}
```

**`<name>.template.ts`**
```typescript
import { html } from '@melodicdev/core';
import type { <PascalName>Component } from './<name>.component.js';

export function <PascalName>Template(c: <PascalName>Component) {
  return html`
    <div class="ml-<name>">
      <slot></slot>
    </div>
  `;
}
```

**`<name>.styles.ts`**
```typescript
import { css } from '@melodicdev/core';

export const <PascalName>Styles = () => css`
  :host {
    display: block;
  }

  .ml-<name> {
    font-family: var(--ml-font-sans);
  }
`;
```

**`index.ts`**
```typescript
export { <PascalName>Component } from './<name>.component.js';
```

---

### Step 2 — Add export to `packages/melodic-components/package.json`

Add a new entry inside the `"exports"` object (keep alphabetical order):
```json
"./<name>": {
  "types": "./lib/components/<category>/<name>/index.d.ts",
  "default": "./lib/components/<category>/<name>/index.js"
}
```

---

### Step 3 — Add path alias to `tsconfig.json`

Add to `compilerOptions.paths`:
```json
"@melodicdev/components/<name>": ["packages/melodic-components/src/components/<category>/<name>/index.ts"]
```

---

### Step 4 — Add Vite alias to `vite.config.demo.ts`

Add to the `resolve.alias` array:
```typescript
{ find: '@melodicdev/components/<name>', replacement: resolve(__dirname, 'packages/melodic-components/src/components/<category>/<name>/index.ts') }
```

---

### Step 5 — Register in `web/demo/main.ts`

Add:
```typescript
import '@melodicdev/components/<name>';
```

---

### Step 6 — Add to demo app template

In `web/demo/components/demo-app/demo-app.template.ts`, add:
- A navigation link in the sidebar nav list
- A `<section id="<name>">` demo block showing the component

---

### Step 7 — Type-check

Run `npx tsc --noEmit` and fix any errors before finishing.

---

## Naming Rules

- Element selector: `ml-<name>` (kebab-case, `ml-` prefix)
- Custom events: `ml:<event>` prefix (e.g. `ml:change`, `ml:select`)
- CSS classes: `ml-<name>__<element>`, `ml-<name>--<modifier>` (BEM-style)
- CSS values: always use design tokens (`var(--ml-color-primary)`) — never hardcode colors, sizes, or fonts
- Private/non-reactive fields: prefix with `_`
- Observed HTML attributes: list in the `attributes: []` array of `@MelodicComponent`
