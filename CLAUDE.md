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
└── docs/                   # Documentation files
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
  styles: myStyles
})
export class MyComponent {
  count = 0;

  onInit() { }
  onCreate() { }
  onRender() { }
  onDestroy() { }
}
```

**Lifecycle Hooks:**
- `onInit()` - Before DOM attachment, after property observation
- `onCreate()` - After `connectedCallback()` (element in DOM)
- `onRender()` - After each render
- `onDestroy()` - On `disconnectedCallback()` (element removed)
- `onAttributeChange(name, oldVal, newVal)` - Observed attribute changes
- `onPropertyChange(name, oldVal, newVal)` - Before property changes

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

## Melodic Components Library

Located in `packages/melodic-components/`, this is a themeable UI component library.

### Available Components

**Forms:** Button, Input, Textarea, Checkbox, Radio, RadioGroup, Toggle, Select, FormField

**Feedback:** Spinner, Alert, Toast, Skeleton, Progress

**Foundation:** Card, Divider, Stack, Container, Grid

**Data Display:** Avatar, Badge, Stat, EmptyState

**Navigation:** Tabs, Breadcrumb, Pagination

**Overlays:** Modal, Drawer, Dropdown, Tooltip, Popover

### Theme System

Token-based theming with light/dark mode support:

```typescript
import { applyTheme, createTheme } from '@melodicdev/components';

// Apply built-in theme
applyTheme('light'); // or 'dark'

// Create custom theme
const customTheme = createTheme({
  colors: { ... },
  spacing: { ... }
});
```

**Token categories:** colors, typography, spacing, shadows, borders, breakpoints, transitions

### Component File Structure

```
component-name/
├── component-name.component.ts  # Component class
├── component-name.template.ts   # HTML template
└── component-name.styles.ts     # CSS styles
```

## CLI Tool

```bash
# Initialize new project
melodic init <dir> [--monorepo] [--app-name]

# Add to existing project
melodic add app <name>
melodic add lib <name>

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

Located in `/docs/`:
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

## Git Commit Preferences

- **Do not add Claude as co-author** on commits (no `Co-Authored-By` line)

## Testing

Unit tests are located in `/tests/unit/` covering signals, templates, routing, HTTP, state, and component lifecycle.

```bash
npm test
```

## Notes for Development

- **Directive state caching:** Custom directives should always return state from render functions
- **Property observation:** The `observe()` method preserves existing getters/setters on component properties
