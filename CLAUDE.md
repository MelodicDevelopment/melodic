# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Melodic** is a lightweight web component framework monorepo featuring:
- Custom element system using TypeScript decorators
- Ultra-fast template system with tagged template literals
- Plugin-friendly directive system for DOM manipulation
- Shadow DOM encapsulation
- Reactive property observation with Signals
- Client-side routing with guards and resolvers
- Reactive forms system
- HTTP client with interceptors
- Dependency injection
- State management
- Environment-aware configuration
- Themeable UI component library

## Monorepo Structure

```
melodic/
├── packages/
│   ├── melodic-components/  # @melodicdev/components - UI component library
│   └── cli/                 # @melodicdev/cli - Scaffolding tool
├── src/                     # @melodicdev/core - Core framework
├── web/
│   ├── demo/               # Component library demo
│   └── example/            # Framework example app
└── docs/                   # Core framework documentation files
```

### Packages

| Package | Version | Description |
|---------|---------|-------------|
| `@melodicdev/core` | 1.2.5 | Core framework |
| `@melodicdev/components` | 0.1.0 | Themeable UI component library |
| `@melodicdev/cli` | 1.2.3 | CLI scaffolding tool |

## Build Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Compile TypeScript and build for production
npm run preview  # Preview production build
```

## Core Modules

### Import Paths

```typescript
import { ... } from '@melodicdev/core';           // Main exports
import { ... } from '@melodicdev/core/bootstrap'; // App bootstrap
import { ... } from '@melodicdev/core/components';// Component utilities
import { ... } from '@melodicdev/core/config';    // Configuration
import { ... } from '@melodicdev/core/forms';     // Forms system
import { ... } from '@melodicdev/core/http';      // HTTP client
import { ... } from '@melodicdev/core/injection'; // Dependency injection
import { ... } from '@melodicdev/core/routing';   // Router
import { ... } from '@melodicdev/core/signals';   // Signals
import { ... } from '@melodicdev/core/state';     // State management
import { ... } from '@melodicdev/core/template';  // Template utilities
```

### Component System (`src/components/`)

Components use the `@MelodicComponent` decorator and extend `HTMLElement` via `ComponentBase`:

```typescript
@MelodicComponent({
  selector: 'my-component',
  template: myTemplate,
  styles: myStyles,
  attributes: ['my-attr']   // observed HTML attributes
})
export class MyComponent {
  count = 0;

  onInit() { }
  onCreate() { }
  onRender() { }
  onDestroy() { }
  onPropertyChange(name, oldVal, newVal) { }
  onAttributeChange(name, oldVal, newVal) { }
}
```

**Lifecycle Hooks:**
- `onInit()` - Before DOM attachment, after property observation
- `onCreate()` - After `connectedCallback()` (element in DOM)
- `onRender()` - After each render
- `onDestroy()` - On `disconnectedCallback()` (element removed)
- `onAttributeChange(name, oldVal, newVal)` - Observed attribute changes
- `onPropertyChange(name, oldVal, newVal)` - Before property changes

**Important:** Properties prefixed with `_` are excluded from reactivity. Use `_` for private fields that should not trigger re-renders.

### Configuration (`src/config/`)

Environment-aware configuration with DI integration:

```typescript
import { defineConfig, provideConfig } from '@melodicdev/core/config';

const appConfig = defineConfig({
  base: { appName: 'My App', apiBaseURL: '/data' },
  prod: { apiBaseURL: 'https://api.example.com' },
});

// Register in bootstrap
await bootstrap({
  providers: [provideConfig(appConfig)],
});
```

**Key exports:** `defineConfig`, `provideConfig`, `APP_CONFIG` token, `environment`, `getEnvironment`, `Environment` type, `ConfigDefinition` interface

### Signals System (`src/signals/`)

Fine-grained reactive primitives:

```typescript
import { signal, computed, SignalEffect } from '@melodicdev/core/signals';

const count = signal(0);
const doubled = computed(() => count() * 2);

const effect = new SignalEffect(() => {
  console.log('Count:', count());
});
effect.run();

count.set(5);        // Triggers effect
count.update(n => n + 1);
```

### Routing System (`src/routing/`)

Client-side routing with guards and resolvers:

```typescript
import { RouterService, RouterOutlet, RouterLink } from '@melodicdev/core/routing';

const routes = [
  { path: '', component: HomeComponent },
  { path: 'users/:id', component: UserComponent, guards: [authGuard] },
  { path: '**', component: NotFoundComponent }
];

// Navigation
router.navigate('/users/123', { scrollToTop: true });
```

### Forms System (`src/forms/`)

Reactive forms with validation:

```typescript
import { createFormControl, createFormGroup, Validators } from '@melodicdev/core/forms';

const email = createFormControl('', [Validators.required, Validators.email]);
const form = createFormGroup({
  email: createFormControl(''),
  password: createFormControl('')
});

form.value;      // { email: '', password: '' }
form.valid;      // boolean
form.errors;     // validation errors
```

### HTTP Module (`src/http/`)

HTTP client with interceptors:

```typescript
import { RequestManager } from '@melodicdev/core/http';

const http = new RequestManager();
http.addInterceptor(authInterceptor);

const data = await http.get<User[]>('/api/users');
```

### Dependency Injection (`src/injection/`)

```typescript
import { Injectable, Inject } from '@melodicdev/core/injection';

@Injectable()
class MyService {
  constructor(@Inject(OtherService) private other: OtherService) {}
}
```

### State Management (`src/state/`)

Centralized state with signals:

```typescript
import { createStore } from '@melodicdev/core/state';

const store = createStore({
  count: 0,
  user: null
});
```

## Template System (`src/template/`)

**Parse-once, update-forever strategy:**

```typescript
import { html, render } from '@melodicdev/core';

const template = (name: string) => html`
  <div class="greeting">Hello, ${name}!</div>
  <button @click=${handleClick}>Click me</button>
  <input .value=${inputValue} />
`;
```

**Binding types:**
- `${value}` - Text interpolation
- `@event=${handler}` - Event binding
- `.property=${value}` - Property binding
- `attribute=${value}` - Attribute binding

**Built-in directives:**
- `repeat(items, keyFn, template)` - Keyed list rendering
- `when(condition, template)` - Conditional rendering
- `classMap({ class: boolean })` - Dynamic CSS classes
- `styleMap({ prop: value })` - Dynamic inline styles
- `unsafeHTML(htmlString)` - Raw HTML rendering

---

## Melodic Components Library

Located in `packages/melodic-components/`. Full documentation in `packages/melodic-components/docs/`.

### Component Import Paths

```typescript
// Register a component's custom element
import '@melodicdev/components/button';
import '@melodicdev/components/table';
// etc.

// Theme system
import { applyTheme, toggleTheme, injectTheme, createBrandTheme } from '@melodicdev/components/theme';

// Utilities (positioning, a11y, virtual scroll, styles)
import { computePosition, focusTrap, announce, VirtualScroller, resetStyles } from '@melodicdev/components/utils';

// Event/DOM directives
import { clickOutside } from '@melodicdev/components/directives';

// Misc functions
import { newID } from '@melodicdev/components/functions';

// Design token objects (for JS use)
import { breakpoints, colorTokens, allTokens, tokensToCss } from '@melodicdev/components/theme';
```

### Available Components

**Forms:** `ml-button`, `ml-button-group`, `ml-input`, `ml-textarea`, `ml-checkbox`, `ml-radio`, `ml-radio-group`, `ml-radio-card-group`, `ml-toggle`, `ml-select`, `ml-slider`, `ml-date-picker`, `ml-form-field`

**Feedback:** `ml-spinner`, `ml-alert`, `ml-progress`, `ml-toast` (+ `ToastService`)

**Foundation:** `ml-card`, `ml-divider`, `ml-stack`, `ml-container`

**Data Display:** `ml-avatar`, `ml-badge`, `ml-badge-group`, `ml-tag`, `ml-list`, `ml-list-item`, `ml-activity-feed`, `ml-activity-item`, `ml-table`, `ml-data-grid`, `ml-calendar-view`

**Navigation:** `ml-tabs`, `ml-tab`, `ml-tab-panel`, `ml-breadcrumb`, `ml-breadcrumb-item`, `ml-pagination`, `ml-sidebar`, `ml-sidebar-group`, `ml-sidebar-item`, `ml-steps`, `ml-step`, `ml-step-panel`

**Overlays:** `ml-dialog` (+ `DialogService`), `ml-drawer`, `ml-popover`, `ml-dropdown`, `ml-dropdown-item`, `ml-dropdown-group`, `ml-dropdown-separator`, `ml-tooltip`

**Sections:** `ml-app-shell`, `ml-page-header`, `ml-hero-section`

**General:** `ml-icon` (Phosphor Icons via font ligatures)

### Theme System

Token-based CSS custom property system with light/dark/system mode and custom theme support.

```typescript
import { applyTheme, toggleTheme, injectTheme, createBrandTheme } from '@melodicdev/components/theme';

// Built-in modes — applyTheme handles setAttribute internally
applyTheme('light');   // data-theme="light"
applyTheme('dark');    // data-theme="dark"
applyTheme('system');  // follows OS preference, auto-updates

toggleTheme();         // flip between light and dark

// Named custom theme (manual setAttribute required — do NOT also call applyTheme)
injectTheme('brand', {
  '--ml-color-primary':       '#7c3aed',
  '--ml-color-primary-hover': '#6d28d9',
});
document.documentElement.setAttribute('data-theme', 'brand');

// Brand color convenience helper
const css = createBrandTheme('brand', { primary: '#7c3aed', secondary: '#6b7280' });
```

**Token categories:** colors (semantic + primitive palette), typography, spacing (4px scale), shadows, borders/radius, breakpoints, transitions

**IMPORTANT:** `applyTheme` and named themes via `setAttribute` are mutually exclusive. Calling `applyTheme` after setting a custom `data-theme` will overwrite it.

### Virtual Scrolling

`ml-table` and `ml-data-grid` support virtual scrolling via the `virtual` attribute. The parent element must have a defined height.

```html
<div style="height: 500px;">
  <ml-table virtual .rows=${rows} .columns=${cols}></ml-table>
</div>

<div style="height: 500px;">
  <ml-data-grid virtual .rows=${rows} .columns=${cols}></ml-data-grid>
</div>
```

The underlying `VirtualScroller` class is exported from `@melodicdev/components/utils` for use in custom components.

### Key Utilities

```typescript
import { computePosition, autoUpdate, offset, flip, shift, arrow } from '@melodicdev/components/utils';
import { focusTrap, createFocusTrap, getFocusableElements, announce } from '@melodicdev/components/utils';
import { focusVisible, isFocusVisible } from '@melodicdev/components/utils';
import { clickOutside, createClickOutsideHandler } from '@melodicdev/components/utils';
import { VirtualScroller } from '@melodicdev/components/utils';
import { resetStyles, visuallyHiddenStyles, componentBaseStyles } from '@melodicdev/components/utils';
import { newID } from '@melodicdev/components/functions';
```

See `packages/melodic-components/docs/utilities.md` and `packages/melodic-components/docs/directives-and-functions.md` for full API details.

### Component File Structure

```
component-name/
├── index.ts                     # Barrel export
├── component-name.component.ts  # Component class (@MelodicComponent)
├── component-name.template.ts   # HTML template function
├── component-name.styles.ts     # CSS styles (css tagged template)
└── component-name.types.ts      # Shared types (optional)
```

Multi-component directories (e.g. tabs, sidebar, steps) use the same pattern with one file per element and a shared `index.ts` barrel.

### Adding a New Component Checklist

1. Create files in `packages/melodic-components/src/components/<category>/<name>/`
2. Add `<name>/index.ts` barrel exports
3. Add `"./name"` export entry to `packages/melodic-components/package.json`
4. Add path alias to `tsconfig.json`
5. Add Vite alias to `vite.config.demo.ts`
6. Add `import '@melodicdev/components/name'` to `web/demo/main.ts`
7. Add nav link + demo section to `web/demo/components/demo-app/demo-app.template.ts`

---

## CLI Tool

```bash
# Initialize new project
melodic init <dir> [--monorepo] [--app-name]

# Add to existing project
melodic add app <name>
melodic add lib <name>
melodic add config

# Generate code
melodic generate component <name>
melodic generate service <name>
melodic generate directive <name>
```

**Templates:** `basic`, `app-basic`, `lib-basic`, `monorepo-basic`

## TypeScript Configuration

- `experimentalDecorators: true` - Required for decorators
- `emitDecoratorMetadata: true` - Enables decorator metadata
- `useDefineForClassFields: false` - Ensures decorator field behavior
- `verbatimModuleSyntax: true` - Requires `import type` for type-only imports

## Documentation Files

Core framework docs in `/docs/`:
- `CONFIG.md` - Configuration and environment management
- `COMPONENT_SYSTEM.md` - Component creation and lifecycle
- `TEMPLATE_SYSTEM.md` - Template syntax and directives
- `SIGNALS.md` - Reactive signals system
- `ROUTING.md` - Router configuration and navigation
- `FORMS.md` - Forms and validation
- `HTTP.md` - HTTP client usage
- `INJECTION.md` - Dependency injection
- `BOOTSTRAP.md` - App initialization
- `STATE.md` - State management
- `CODING_PRACTICES.md` - Code standards and ESLint

Component library docs in `packages/melodic-components/docs/`:
- `theming.md` - Token system, theme API, dark mode, custom themes
- `utilities.md` - Positioning, accessibility, virtual scroll, style utilities
- `directives-and-functions.md` - clickOutside, newID, token objects
- `components/forms.md`
- `components/foundation.md`
- `components/feedback.md`
- `components/data-display.md`
- `components/navigation.md`
- `components/overlays.md`
- `components/sections.md`

## Git Commit Preferences

- **Do not add Claude as co-author** on commits (no `Co-Authored-By` line)
- **Do not auto-commit** — never commit changes unless explicitly asked

## Testing

Unit tests are located in `/tests/unit/` covering signals, templates, routing, HTTP, state, and component lifecycle.

```bash
npm test
```

## Notes for Development

- **Directive state caching:** Custom directives should always return state from render functions
- **Property observation:** The `observe()` method preserves existing getters/setters on component properties
- **Shadow DOM styling:** All components use Shadow DOM. External styles reach internals only via CSS custom properties (tokens). Override tokens on the host element or a parent selector.
- **Virtual scroll layout:** When using the `virtual` attribute on `ml-table` or `ml-data-grid`, the parent must have a defined height. The host uses `:host([virtual]) { height: 100% }` so it fills that container via a flex column layout.
- **`ml-list` virtual scrolling:** `ml-list` uses `<slot>` for composition and cannot support virtual scrolling — use `ml-table` or `ml-data-grid` for large virtualized datasets.
- **Overlays:** Popover, dropdown, and tooltip use the Popover API + `computePosition`/`autoUpdate` from `utils/positioning/`. Import `Placement` type from `../../../types/index.js` in component files.
