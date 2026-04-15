# Melodic Framework — Complete Reference

> Auto-generated from source code analysis. Covers every module, class, function, type, and pattern in `@melodicdev/core`.

---

## Table of Contents

- [Core Architecture](#core-architecture)
  - [Bootstrap & Initialization](#bootstrap--initialization)
  - [Component System](#component-system)
  - [Lifecycle Hooks](#lifecycle-hooks)
  - [DOM Strategy](#dom-strategy)
- [Templating & Rendering](#templating--rendering)
  - [Tagged Template Literals](#tagged-template-literals)
  - [Binding Types](#binding-types)
  - [Template Caching & Parse-Once Strategy](#template-caching--parse-once-strategy)
  - [Built-in Directives](#built-in-directives)
  - [Custom Directives](#custom-directives)
  - [Attribute Directives](#attribute-directives)
  - [Content Projection (Slots)](#content-projection-slots)
- [Reactivity & State](#reactivity--state)
  - [Signals](#signals)
  - [Computed Signals](#computed-signals)
  - [Signal Effects](#signal-effects)
  - [Component Property Reactivity](#component-property-reactivity)
  - [Render Batching](#render-batching)
- [Props & Data Flow](#props--data-flow)
  - [Passing Props into Components](#passing-props-into-components)
  - [Parent-Child Communication](#parent-child-communication)
  - [Sibling & Cross-Component Communication](#sibling--cross-component-communication)
- [Events](#events)
  - [DOM Event Handling](#dom-event-handling)
  - [Custom Events](#custom-events)
- [State Management](#state-management)
  - [Global Store (SignalStoreService)](#global-store-signalstoreservice)
  - [Component-Local State (ComponentStateBaseService)](#component-local-state-componentstatebaseservice)
  - [Actions, Reducers, Effects](#actions-reducers-effects)
- [Configuration](#configuration)
- [Dependency Injection](#dependency-injection)
- [Routing](#routing)
  - [Route Definition](#route-definition)
  - [RouterService](#routerservice)
  - [Navigation](#navigation)
  - [Guards & Resolvers](#guards--resolvers)
  - [Router Components](#router-components)
- [HTTP Client](#http-client)
  - [HttpClient Class](#httpclient-class)
  - [Interceptors](#interceptors)
  - [Request Deduplication](#request-deduplication)
  - [Error Handling](#error-handling)
- [Forms](#forms)
  - [FormControl](#formcontrol)
  - [FormGroup](#formgroup)
  - [Validators](#validators)
  - [Form Directive](#form-directive)
- [Extension Points](#extension-points)
- [Best Practices](#best-practices)
- [Public API Surface](#public-api-surface)

---

## Core Architecture

### Bootstrap & Initialization

Source: `src/bootstrap/`

```typescript
import { bootstrap } from '@melodicdev/core/bootstrap';

const app = await bootstrap({
  providers: [provideConfig(appConfig), provideHttp({ baseURL: '/api' })],
  rootComponent: 'my-app',
  target: '#app',
  devMode: true,
  onBefore: async () => { /* pre-boot async work */ },
  onReady: () => { /* post-boot sync work */ },
  onError: (error, context) => { /* global error handler */ }
});
```

#### `IAppConfig` Interface

| Field | Type | Description |
|-------|------|-------------|
| `providers` | `Provider[]` | DI provider functions |
| `devMode` | `boolean` | Enables `[Melodic]` console logging |
| `onError` | `(error, context) => void` | Global handler for `window` error/unhandledrejection |
| `onBefore` | `() => void \| Promise<void>` | Async hook before providers register |
| `onReady` | `() => void` | Sync hook after everything initializes |
| `rootComponent` | `string` | Tag name of root custom element |
| `target` | `string \| HTMLElement` | Mount target (selector or element) |

#### `Provider` Type

```typescript
type Provider = (injector: InjectionEngine) => void;
```

#### `IMelodicApp` Interface

```typescript
interface IMelodicApp {
  isDevMode: boolean;
  get<T>(token: Token<T>): T;    // Shortcut to Injector.get()
  http?: HttpClient;
  rootElement?: HTMLElement;
  destroy(): void;                // Removes error handlers and root element
}
```

#### Bootstrap Execution Order

1. Attach global error handlers (if `onError` provided)
2. `await onBefore()` (if provided)
3. Register all providers — each receives the global `Injector`
4. Verify `rootComponent` is registered via `customElements.get()`
5. `document.createElement(rootComponent)` → append to `target`
6. Build `IMelodicApp` instance
7. Call `onReady()` (if provided)
8. Bind app as `'IMelodicApp'` value in DI container
9. Return `IMelodicApp`

**Bootstrap is optional** — components work without it if DI bindings are registered manually.

---

### Component System

Source: `src/components/`

Components use the `@MelodicComponent` decorator and are plain classes — they never extend `HTMLElement` directly. The framework uses a **two-object pattern**: a `ComponentBase` (extending `HTMLElement`) wraps a separate user-class instance.

#### `@MelodicComponent` Decorator

```typescript
@MelodicComponent({
  selector: 'my-component',
  template: myTemplate,
  styles: myStyles,
  attributes: ['my-attr']
})
export class MyComponent {
  count = 0;
  // ...
}
```

#### `ComponentMeta` / `TypedComponentMeta<C>`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `selector` | `string` | Yes | Custom element tag name |
| `template` | `(component, attributes?) => TemplateResult` | No | Template function |
| `styles` | `() => TemplateResult` | No | Styles via `css` tagged template |
| `attributes` | `string[]` | No | HTML attributes to observe |

#### What the Decorator Does

1. Checks `customElements.get(selector)` — skips if already registered (idempotent)
2. Creates an anonymous class extending `ComponentBase`
3. In its constructor: resolves `@Inject` dependencies from the global `Injector`, then calls `super(meta, Reflect.construct(component, dependencies))`
4. Sets `static observedAttributes` from `meta.attributes`
5. Calls `customElements.define(selector, webComponent)`

#### `ComponentBase` Constructor Flow

1. `super()` — `HTMLElement` constructor
2. Store meta and component references
3. `component.elementRef = this` — gives user class access to the DOM element
4. `attachShadow({ mode: 'open' })` — always open Shadow DOM
5. `applyGlobalStyles(shadowRoot)` — adopt document-level `<style melodic-styles>` sheets
6. `renderStyles()` — create `<style>` element in shadow root
7. `observe()` — set up reactive property observation
8. Call `component.onInit()` if defined

---

### Lifecycle Hooks

All hooks are optional. Implement only what you need.

```typescript
interface ILifeCycleHooks {
  onInit?(): void;
  onCreate?(): void;
  onRender?(): void;
  onDestroy?(): void;
  onAttributeChange?(attribute: string, oldVal: unknown, newVal: unknown): void;
  onPropertyChange?(property: string, oldVal: unknown, newVal: unknown): void;
}
```

#### Complete Execution Order

```
constructor:
  1. Shadow DOM attached (mode: 'open')
  2. Global styles applied (adoptedStyleSheets)
  3. Component styles rendered (<style> element)
  4. Property observation established (Object.defineProperty getters/setters)
  5. onInit()

connectedCallback:
  6. render() — template evaluated, DOM patched
  7. onRender() — post-render hook
  8. onCreate() — element is in the DOM

[Property changes]:
  9. onPropertyChange(name, oldVal, newVal) — called BEFORE value stored
  10. scheduleRender() → render() → onRender()

[Attribute changes]:
  11. Kebab-to-camelCase property sync
  12. scheduleRender() → render() → onRender()
  13. onAttributeChange(attribute, oldVal, newVal)

disconnectedCallback:
  14. Signal unsubscriptions
  15. Action directive cleanups
  16. onDestroy()
```

**Key details:**
- `onPropertyChange` fires **before** the new value is stored
- `onInit` fires before DOM attachment — do not query `shadowRoot` here
- `onRender` fires after every render, including the initial one
- Always clean up in `onDestroy()` — subscriptions, listeners, timers

---

### DOM Strategy

**No virtual DOM.** The framework uses direct DOM manipulation via a parse-once, update-forever tagged template literal system. Template parts track their DOM positions and update only changed bindings on subsequent renders.

---

## Templating & Rendering

Source: `src/template/`

### Tagged Template Literals

```typescript
import { html, css, render } from '@melodicdev/core';

const myTemplate = (component: MyComponent) => html`
  <div class="greeting">Hello, ${component.name}!</div>
  <button @click=${component.handleClick}>Click</button>
`;

const myStyles = () => css`
  :host { display: block; }
  .greeting { color: var(--ml-color-text); }
`;
```

`html` and `css` are the same function — both return a `TemplateResult`.

### Binding Types

| Syntax | Type | Example | Behavior |
|--------|------|---------|----------|
| `${value}` | Text interpolation | `<p>${name}</p>` | Sets `textContent`; handles directives, nested templates, arrays, nodes |
| `@event=${handler}` | Event binding | `@click=${this.onClick}` | `addEventListener`/`removeEventListener` |
| `.property=${value}` | Property binding | `.value=${inputVal}` | Direct `element[prop] = value` |
| `attribute=${value}` | Attribute binding | `class=${cls}` | `setAttribute`/`removeAttribute`; supports composite attrs |
| `?attribute=${bool}` | Boolean attribute | `?disabled=${isOff}` | Adds/removes attribute based on truthiness |
| `:directive=${value}` | Action directive | `:routerLink=${path}` | Invokes registered attribute directive |

#### Attribute Binding Details

- `null`, `undefined`, `false` → removes attribute
- `true` → sets empty attribute (`setAttribute(name, '')`)
- **Composite attributes**: `class="prefix-${a}-${b}"` — multiple interpolations in one attribute, assembled from static/dynamic segments

#### Node Interpolation Details

- **Directive** (`__directive: true`): calls `value.render(node, previousState)`
- **`TemplateResult`**: nested rendering with persistent `DocumentFragment` for in-place updates
- **DOM `Node`**: inserted between start/end markers
- **Array**: keyed reconciliation (for `__keyed` items) or sequential rendering
- **Primitive**: `String(value ?? '')`

### Template Caching & Parse-Once Strategy

1. **First render**: Parses HTML string with markers, creates `<template>` element, identifies dynamic "parts", caches structure
2. **Subsequent renders**: Reuses cached template, clones DOM, updates only changed parts

Caching is by `TemplateStringsArray` identity (WeakMap) with a 500-entry parsed template LRU cache. Part paths are pre-computed for direct node access without DOM tree walks.

### Built-in Directives

#### `repeat(items, keyFn, template)`

Efficient keyed list rendering with minimal DOM mutations using LIS (Longest Increasing Subsequence) algorithm.

```typescript
import { repeat } from '@melodicdev/core';

html`${repeat(
  items,
  (item) => item.id,
  (item, index) => html`<li>${item.name}</li>`
)}`
```

- **Fast path**: same key order → in-place template updates, no reconciliation
- **CompiledTemplate optimization**: simple single-element templates use `createElement` directly
- Each item bounded by comment markers for efficient range operations

#### `repeatRaw(items, keyFn, factory)`

Maximum-performance list rendering bypassing the template system entirely.

```typescript
html`${repeatRaw(
  items,
  (item) => item.id,
  (item) => {
    const el = document.createElement('li');
    el.textContent = item.name;
    return el;
  }
)}`
```

#### `when(condition, trueTemplate, falseTemplate?)`

Conditional rendering. Templates are **factory functions** (lazy evaluation).

```typescript
html`${when(
  isLoggedIn,
  () => html`<p>Welcome back!</p>`,
  () => html`<p>Please log in</p>`
)}`
```

- Transitions between true/false clean up old DOM and render new content
- Same-state updates do in-place DOM patching (no recreation)

#### `classMap(classes)`

```typescript
html`<div class=${classMap({ active: isActive, disabled: isOff })}></div>`
```

Adds/removes CSS classes based on boolean values. Tracks previously applied classes for cleanup.

#### `styleMap(styles)`

```typescript
html`<div style=${styleMap({ fontSize: '14px', color: textColor })}></div>`
```

Converts camelCase to kebab-case. Sets via `style.setProperty()`, removes via `style.removeProperty()`.

#### `unsafeHTML(htmlString)`

```typescript
html`<div>${unsafeHTML(rawHtml)}</div>`
```

Renders raw HTML. Skips update if string is unchanged. **Only use with trusted content.**

#### `portalDirective`

Teleports an element to a different DOM location. Also available as an attribute directive.

```html
<div :portal="body">This renders in <body></div>
<div :portal=${{ target: '#modal-root', persist: true }}>Persists after unmount</div>
```

### Custom Directives

#### Function-based

```typescript
import { directive } from '@melodicdev/core/template';

const highlight = (color: string) => directive((container: Node, prevState?: any) => {
  const el = container as HTMLElement;
  el.style.backgroundColor = color;
  return null; // return state for next render
});

// Usage: html`<p>${highlight('yellow')}</p>`
```

#### Class-based

```typescript
import { Directive } from '@melodicdev/core/template';

class MyDirective extends Directive {
  render(container: Node, previousState?: any): any {
    // ...
    return newState;
  }
}
```

### Attribute Directives

Register globally, use with `:name` syntax in templates.

```typescript
import { registerAttributeDirective } from '@melodicdev/core/template';

registerAttributeDirective('tooltip', (element, value, name) => {
  // Setup
  const handler = () => showTooltip(value as string);
  element.addEventListener('mouseenter', handler);

  // Return cleanup
  return () => element.removeEventListener('mouseenter', handler);
});
```

```html
<span :tooltip="Helpful text">Hover me</span>
<span :tooltip=${dynamicText}>Dynamic</span>
```

**Registry API:**

| Function | Description |
|----------|-------------|
| `registerAttributeDirective(name, fn)` | Register a directive |
| `getAttributeDirective(name)` | Look up (case-insensitive fallback) |
| `hasAttributeDirective(name)` | Check existence |
| `unregisterAttributeDirective(name)` | Remove |
| `getRegisteredDirectives()` | List all names |

**Built-in attribute directives:** `portal`, `routerLink` (auto-registered on routing import), `formControl` (auto-registered on forms import)

### Content Projection (Slots)

Uses native Shadow DOM `<slot>` elements — no custom slot mechanics.

```typescript
// Component template
html`<div class="card">
  <slot name="header"></slot>
  <slot></slot>  <!-- default slot -->
  <slot name="footer"></slot>
</div>`

// Usage
html`<my-card>
  <h3 slot="header">Title</h3>
  <p>Body content</p>
  <div slot="footer">Actions</div>
</my-card>`
```

Style projected content with `::slotted()`.

---

## Reactivity & State

Source: `src/signals/`

### Signals

Fine-grained reactive primitives.

```typescript
import { signal } from '@melodicdev/core/signals';

const count = signal(0);
count();           // Read: 0
count.set(5);      // Set
count.update(n => n + 1);  // Update via function
```

#### `Signal<T>` Type

```typescript
type Signal<T> = {
  (): T;                        // Read (auto-tracks effects)
  set(value: T): void;         // Set (notifies if value !== oldValue)
  update(updater: (current: T) => T): void;
  subscribe(subscriber: (value: T) => void): () => void;
  unsubscribe(subscriber: (value: T) => void): void;
  destroy(): void;              // Clear all subscribers
};
```

- **Equality check**: strict identity (`!==`). Object/array mutations without new reference won't trigger updates.
- **No batching** in signals themselves — each `set()` synchronously notifies all subscribers.
- Tagged with `SIGNAL_MARKER` symbol for identification via `isSignal()`.

### Computed Signals

```typescript
import { computed } from '@melodicdev/core/signals';

const doubled = computed(() => count() * 2);
doubled(); // Automatically re-evaluates when count changes
```

- Internally creates a signal + a `SignalEffect` that updates it
- Dependencies are auto-tracked — reading a signal inside the computation subscribes to it
- Computed signals chain — a computed can depend on other computed signals

### Signal Effects

```typescript
import { SignalEffect } from '@melodicdev/core/signals';

const effect = new SignalEffect(() => {
  console.log('Count changed:', count());
});
effect.run();  // Initial run + subscribes to count

// Later:
effect.destroy();  // Unsubscribes from all dependencies
```

- **Dependencies fully re-tracked on every execution** — conditional reads auto-unsubscribe
- **Re-entrancy protection** — if an effect writes to a signal it reads, it sets `_needsRerun` and loops
- **Nested effects supported** — previous active effect saved/restored (stack behavior)
- `run` is a stable bound function reference (used as subscriber identity)

### Component Property Reactivity

The `observe()` method in `ComponentBase` sets up reactivity via `Object.defineProperty`:

1. Collects all own properties from the component instance and prototype chain
2. **Skips**: `_`-prefixed properties, `Signal` instances, `AbstractControl` instances, functions, `elementRef`, `constructor`
3. For each property: defines getter/setter on both the component and the HTMLElement wrapper
   - **Setter**: calls `onPropertyChange(prop, oldVal, newVal)` if changed, updates value, calls `scheduleRender()`
   - **Getter**: returns cached value (or calls original getter if one existed)
4. For `Signal`-typed properties: subscribes to the signal → `scheduleRender()` on change
5. For `AbstractControl`-typed properties (FormControl, FormGroup, FormArray): subscribes to the control's `state` signal → `scheduleRender()` on change. Form controls aren't mirrored on the wrapper element.

**Properties are mirrored** on both the component instance and the HTMLElement wrapper, enabling `.property=${value}` bindings. Forms are excluded from mirroring since they're typically owned by the component, not passed in.

### Render Batching

```typescript
private scheduleRender(): void {
  if (this._renderScheduled) return;
  this._renderScheduled = true;
  queueMicrotask(() => {
    this._renderScheduled = false;
    if (this.isConnected) this.render();
  });
}
```

Multiple synchronous property changes or signal updates produce a **single render** at the end of the current microtask.

---

## Props & Data Flow

### Passing Props into Components

Components receive data through two mechanisms:

**1. Property bindings** (`.property=${value}` in templates):

```typescript
html`<user-card .user=${currentUser} .showAvatar=${true}></user-card>`
```

Property bindings set values directly on the custom element. Because `observe()` mirrors getter/setter pairs on both the component instance and the HTMLElement wrapper, `.property` bindings on the host element trigger the same reactivity pipeline (change detection → `onPropertyChange` → `scheduleRender`).

**2. HTML attributes** (`attribute=${value}` in templates):

```typescript
html`<user-card name=${userName} role="admin"></user-card>`
```

Observed attributes (listed in `@MelodicComponent({ attributes: [...] })`) are automatically synced to camelCase properties on the component via `attributeChangedCallback`. Kebab-case attributes map to camelCase properties (e.g., `my-attr` → `myAttr`). Boolean attribute conversion: any value except `null` and `'false'` becomes `true`.

**Key difference:** Property bindings pass JavaScript values (objects, arrays, functions). Attribute bindings pass strings only. Use `.property` for complex data, `attribute` for simple strings/numbers.

### Parent-Child Communication

**Parent → Child:** Property bindings (`.property=${value}`) and attribute bindings as described above.

**Child → Parent:** Custom DOM events dispatched from the child, handled with `@event` bindings on the parent:

```typescript
// Child component
this.elementRef.dispatchEvent(new CustomEvent('user-selected', {
  detail: { userId: this.selectedId },
  bubbles: true,
  composed: true   // crosses Shadow DOM boundaries
}));

// Parent template
html`<user-list @user-selected=${(e) => this.handleSelection(e.detail)}></user-list>`
```

**`composed: true`** is critical — without it, events stop at the Shadow DOM boundary and the parent never sees them.

### Sibling & Cross-Component Communication

**Via shared services (recommended):** Use DI to inject the same `@Injectable()` service into both components. Services with signal-based state allow reactive communication:

```typescript
@Injectable()
class SelectionService {
  selectedId = signal<string | null>(null);
}

// Component A
@Service(SelectionService) private _selection!: SelectionService;
selectItem(id: string) { this._selection.selectedId.set(id); }

// Component B — auto-re-renders when selectedId changes
@Service(SelectionService) private _selection!: SelectionService;
```

**Via global state store:** Use `SignalStoreService` for application-wide state (see [State Management](#state-management)).

**Via DOM events:** Dispatch bubbling events from one component and listen in a common ancestor, then pass data down via properties. Less coupled than direct service injection, but more verbose.

---

## Events

### DOM Event Handling

Events are bound in templates using the `@event` syntax:

```typescript
html`
  <button @click=${this.handleClick}>Click</button>
  <input @input=${(e) => this.onInput(e.target.value)} />
  <form @submit=${(e) => { e.preventDefault(); this.onSubmit(); }}>
`
```

**How it works internally:** The template engine stores event bindings as `'event'` parts. On commit:
- If the handler function reference changed, the old listener is removed and the new one added
- If the handler reference is identical, no work is done (identity-based optimization)
- Event listeners are added directly to the DOM element via `addEventListener`

**All standard DOM events** are supported — `click`, `input`, `change`, `submit`, `keydown`, `mouseenter`, `focus`, `blur`, custom events, etc.

### Custom Events

Components emit custom events using the standard `CustomEvent` API:

```typescript
// In a component method
this.elementRef.dispatchEvent(new CustomEvent('value-change', {
  detail: { value: this.currentValue },
  bubbles: true,       // propagates up the DOM tree
  composed: true       // crosses Shadow DOM boundaries
}));
```

**Listening in templates:**

```typescript
html`<my-slider @value-change=${(e) => this.onSliderChange(e.detail.value)}></my-slider>`
```

**Important:** Always set `composed: true` for events that need to cross Shadow DOM boundaries (which is nearly always the case when communicating between components).

There is **no built-in event bus or pub/sub system**. Cross-component communication is handled through:
1. Parent-child event propagation (bubbling custom events)
2. Shared services via DI (signal-based state)
3. Global state store (`SignalStoreService`)

---

## State Management

Source: `src/state/`

Redux-inspired, built on Melodic signals. Two patterns: global sliced store and component-local state.

### Actions, Reducers, Effects

#### Creating Actions

```typescript
import { createAction, props } from '@melodicdev/core/state';

// Action identifiers must match pattern: [Category] Description
const loadUsers = createAction('[Users] Load Users');
const loadUsersSuccess = createAction('[Users] Load Users Success', props<{ users: User[] }>());

// Dispatch
store.dispatch(loadUsers());
store.dispatch(loadUsersSuccess({ users: [...] }));
```

#### Creating Reducers

```typescript
import { onAction, createReducer } from '@melodicdev/core/state';

const usersReducer = createReducer<AppState>(
  onAction(loadUsersSuccess, (state, action) => ({
    ...state,
    users: action.payload.users
  }))
);
```

#### Creating Effects

```typescript
import { EffectsBase } from '@melodicdev/core/state';

class UserEffects extends EffectsBase {
  constructor() {
    super();
    this.addEffect([loadUsers], async (action) => {
      const users = await fetchUsers();
      return loadUsersSuccess({ users });
    });
  }
}
```

Effects return `Action | Action[] | void`. Returned actions are auto-dispatched.

### Global Store (SignalStoreService)

```typescript
import { createState, provideRX, SignalStoreService } from '@melodicdev/core/state';

// Define state
const appState = createState({
  users: [] as User[],
  loading: false
});

// Register in bootstrap
await bootstrap({
  providers: [
    provideRX(appState, { users: usersReducer }, { users: UserEffects }, true)
  ]
});

// Use in components
@Service(SignalStoreService)
private readonly _store!: SignalStoreService<AppState>;

// Select derived values
const activeUsers = this._store.select('users', (users) => users.filter(u => u.active));

// Dispatch
this._store.dispatch('users', loadUsers());
// or without key (searches all reducers):
this._store.dispatch(loadUsers());
```

**`createState(initState)`** converts each top-level key to a `Signal`.

**`provideRX(initState, reducerMap, effectsMap, debug?)`** registers the store with DI.

**Dispatch flow:**
1. Find matching reducer by action type
2. Call `reducer(currentState, action)` → new state
3. `signal.set(newState)` on the state slice
4. Execute matching effects
5. If effect returns action(s), recursively dispatch

### Component-Local State (ComponentStateBaseService)

```typescript
import { ComponentStateBaseService } from '@melodicdev/core/state';

interface CounterState { count: number; }

class CounterStateService extends ComponentStateBaseService<CounterState> {
  constructor() {
    super({ count: 0 }, counterReducer);
  }

  increment() { this.dispatch(increment()); }
  getCount() { return this.select(s => s.count); }
}
```

**Methods:**
- `select<T>(selectFn)` — computed signal from state
- `dispatch(action)` — find reducer, update state, run effects
- `patchState(partial)` — shallow-merge update
- `resetState()` — reset to initial state

---

## Configuration

Source: `src/config/`

### Environment Detection

```typescript
import { environment, getEnvironment } from '@melodicdev/core/config';
// type Environment = 'dev' | 'qa' | 'prod'
```

Detection priority: `VITE_ENV` → `import.meta.env.PROD` → `'dev'` fallback.

### `defineConfig`

```typescript
import { defineConfig } from '@melodicdev/core/config';

const appConfig = defineConfig({
  base: { appName: 'My App', apiBaseURL: '/data' },
  dev: { apiBaseURL: 'http://localhost:3000' },
  prod: { apiBaseURL: 'https://api.example.com' },
});

// Extend a parent config (deep-merged)
const dashboardConfig = defineConfig({
  extends: appConfig,
  base: { appName: 'Dashboard', refreshMs: 30000 },
});
```

Resolves at import time. Environment overrides shallow-merge onto `base`, then `extends` deep-merges.

### Registration & Access

```typescript
import { provideConfig, APP_CONFIG } from '@melodicdev/core/config';

// In bootstrap
await bootstrap({ providers: [provideConfig(appConfig)] });

// In components/services
const config = Injector.get(APP_CONFIG) as MyConfigType;
```

---

## Dependency Injection

Source: `src/injection/`

Global singleton container (`Injector`). No hierarchical/scoped injectors.

### Tokens

```typescript
type Token<T> = string | symbol | INewable<T> | IInjectionToken<T>;

import { createToken } from '@melodicdev/core/injection';
const MY_TOKEN = createToken<MyService>('MY_TOKEN');
```

### Container API (`Injector`)

| Method | Signature | Description |
|--------|-----------|-------------|
| `bind` | `(cls, options?) \| (token, cls, options?)` | Register class binding |
| `bindValue` | `(token, value)` | Register value (always singleton) |
| `bindFactory` | `(token, factory, options?)` | Register factory function |
| `get` | `(token) → T` | Resolve (throws if not found) |
| `has` | `(token) → boolean` | Check existence |
| `getBinding` | `(token) → Binding<T> \| undefined` | Get raw binding |
| `unbind` | `(token) → boolean` | Remove binding |
| `clear` | `()` | Remove all bindings |

All bindings are **singletons by default**. Circular dependencies detected at runtime with descriptive error messages.

### Decorators

#### `@Injectable(meta?)`

Class decorator. Registers in `Injector` at decoration time.

```typescript
@Injectable()
class MyService { }

@Injectable({ token: MY_TOKEN, singleton: true })
class MyServiceImpl { }
```

#### `@Inject(token)`

Parameter decorator for constructor injection.

```typescript
@Injectable()
class UserService {
  constructor(@Inject(HttpClient) private http: HttpClient) {}
}
```

#### `@Service(token)`

Property decorator for lazy injection on components. Resolves on first property access, caches result. Does **not** trigger reactivity.

```typescript
@MelodicComponent({ selector: 'my-comp', template: myTemplate })
class MyComp {
  @Service(UserService) private readonly _userService!: UserService;
}
```

---

## Routing

Source: `src/routing/`

### Route Definition

```typescript
interface IRoute {
  path: string;                              // e.g., '', 'users', 'users/:id', '**'
  component?: string;                        // Custom element tag name
  redirectTo?: string;                       // Redirect target
  loadComponent?: () => Promise<unknown>;    // Lazy-load component
  loadChildren?: () => Promise<{ routes: IRoute[] }>;  // Lazy-load child routes
  children?: IRoute[];                       // Nested routes
  canActivate?: IRouteGuard[];
  canDeactivate?: IRouteGuard[];
  resolve?: Record<string, IRouteResolver>;
  data?: Record<string, unknown>;            // Static data
  name?: string;                             // Named route
}
```

- `path: ''` matches root
- `path: '**'` is wildcard/not-found
- `:param` captures a single segment (matched via `([^/]*)` regex)
- `*param` captures everything (matched via `(.*)` regex)
- `RouteMatcher` supports optional validation rules per param: `RegExp | ((value: string) => boolean) | string`

### RouterService

`@Injectable()` singleton. Monkey-patches `history.pushState`/`replaceState` to dispatch `NavigationEvent`.

#### Key Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setRoutes` | `(routes) → void` | Set root route config |
| `navigate` | `(path, options?) → Promise<INavigationResult>` | Primary navigation |
| `navigateByName` | `(name, params?, options?) → Promise<INavigationResult>` | Named route navigation |
| `replace` | `(path, data?) → void` | Replace URL without guards/resolvers |
| `back` / `forward` / `go` | — | History navigation |
| `getParams` | `() → Record<string, string>` | All route params |
| `getParam` | `(name) → string?` | Single param |
| `getQueryParams` | `() → URLSearchParams` | Query parameters |
| `getRouteData` | `(depth?) → Record<string, unknown>` | Merged static data |
| `getResolvedData` | `(depth?) → Record<string, unknown>` | Merged resolver output |
| `matchPath` | `(path) → IRouteMatchResult` | Match without side effects |

### Navigation

```typescript
await router.navigate('/users/123', {
  scrollToTop: true,
  queryParams: { tab: 'profile' },
  replace: false,
  skipGuards: false,
  skipResolvers: false,
  data: { from: 'dashboard' }
});

// Named route
await router.navigateByName('user-detail', { id: '123' });
```

#### `INavigationOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `data` | `unknown` | — | State data for history |
| `replace` | `boolean` | `false` | Use replaceState |
| `queryParams` | `Record<string, string>` | — | URL query string |
| `skipGuards` | `boolean` | `false` | Skip guard execution |
| `skipResolvers` | `boolean` | `false` | Skip resolver execution |
| `scrollToTop` | `boolean` | `true` | Scroll to top after nav |

#### Navigation Flow

1. Run **deactivation guards** on current routes (if not skipped)
2. Match target path against route tree
3. Handle redirects (recursive navigate with `replace: true`)
4. Run **activation guards** (if not skipped)
5. Run **resolvers** (if not skipped)
6. Update current matches
7. `history.pushState` or `replaceState`
8. Scroll to top or hash target

#### Browser Back/Forward (popstate)

On `popstate` events (browser back/forward buttons):
1. Deactivation guards are run against current matches
2. If blocked, the URL is restored via `replaceState` (prevents URL from changing)
3. If allowed, the new path is matched and a synthetic `NavigationEvent` is dispatched
4. RouterOutlet re-renders based on the new match

### Guards & Resolvers

```typescript
import { createGuard, createDeactivateGuard, createResolver } from '@melodicdev/core/routing';

const authGuard = createGuard(async (context) => {
  if (!isAuthenticated()) return '/login';  // Redirect
  return true;                               // Allow
});

const unsavedChangesGuard = createDeactivateGuard((context) => {
  if (hasUnsavedChanges()) return false;     // Block
  return true;
});

const userResolver = createResolver(async (context) => {
  return await fetchUser(context.params.id);
});
```

**Guard return values:** `true` (allow), `false` (block), `string` (redirect)

**Guard context:**

```typescript
interface IGuardContext {
  route: IRouteMatch;
  matchedRoutes: IRouteMatch[];
  params: Record<string, string>;
  queryParams: URLSearchParams;
  targetPath: string;
  currentPath: string;
  data?: Record<string, unknown>;
}
```

Guards run sequentially root→leaf. First block/redirect stops execution. Resolvers at each depth run in parallel (`Promise.all`).

### Router Components

#### `<router-outlet>`

```html
<router-outlet .routes=${routes}></router-outlet>
```

- Root outlet: calls `router.setRoutes()`, initiates routing on `NavigationEvent`
- Nested outlets: auto-register with parent via `melodic:outlet-register` event
- Handles `loadComponent`, `loadChildren`, redirects, and wildcard routes
- Optimizes param-only changes (skips element recreation)

#### `<router-link>`

```html
<router-link href="/about" active-class="selected">About</router-link>
```

Props: `href`, `data`, `queryParams`, `activeClass` (`'active'`), `exactMatch` (`false`), `replace` (`false`)

Intercepts clicks (modifier keys open in new tab). Updates `active` class and `aria-current="page"` on navigation.

#### `:routerLink` Directive

```html
<a :routerLink="/home">Home</a>
<a :routerLink=${{ href: '/about', exactMatch: true }}>About</a>
```

---

## HTTP Client

Source: `src/http/`

### HttpClient Class

```typescript
import { HttpClient } from '@melodicdev/core/http';

const http = new HttpClient({ baseURL: '/api', defaultHeaders: { 'X-App': 'melodic' } });

const response = await http.get<User[]>('/users');
const created = await http.post<User>('/users', { name: 'Alice' });
```

#### Constructor Config

```typescript
interface IHttpClientConfig {
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  credentials?: RequestCredentials;
  mode?: RequestMode;
}
```

#### Request Methods

All return `Promise<IHttpResponse<T>>`.

| Method | Signature |
|--------|-----------|
| `get<T>` | `(url, config?) → Promise<IHttpResponse<T>>` (deduplicate defaults `true`) |
| `post<T>` | `(url, body?, config?)` |
| `put<T>` | `(url, body?, config?)` |
| `patch<T>` | `(url, body?, config?)` |
| `delete<T>` | `(url, config?)` |

#### `IRequestConfig`

| Option | Type | Description |
|--------|------|-------------|
| `headers` | `Record<string, string>` | Per-request headers |
| `params` | `Record<string, string \| number \| boolean>` | URL query params |
| `deduplicate` | `boolean` | Deduplicate identical in-flight requests |
| `onProgress` | `(progress) => void` | Download progress callback |
| `abortController` | `AbortController` | Custom abort controller |
| `credentials` | `RequestCredentials` | Credential mode (e.g., `'include'`, `'same-origin'`) |
| `mode` | `RequestMode` | Request mode (e.g., `'cors'`, `'no-cors'`) |
| `cancel` | `IRequestCancellation` | Pre-flight cancellation (set by interceptors) |

#### `IHttpResponse<T>`

```typescript
interface IHttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: IRequestConfig;
}
```

#### Body Handling

Request bodies are processed based on type:
- `FormData`, `Blob`, `ArrayBuffer`, `URLSearchParams`, `ReadableStream`, `string` → passed through as `BodyInit`
- Plain objects → `JSON.stringify()`
- **FormData special case:** `Content-Type` header is explicitly deleted (both casing variants) to let the browser set the correct multipart boundary

#### Response Parsing

Responses are parsed automatically based on `Content-Type`:
- `application/json` → `response.json()`
- `text/*` → `response.text()`
- `application/octet-stream` or `image/*` → `response.blob()`
- Anything else → `response.text()`

#### Progress Tracking

```typescript
const response = await http.get<Blob>('/large-file', {
  onProgress: ({ loaded, total, percentage }) => {
    console.log(`${percentage}% complete`);
  }
});
```

#### Bootstrap Registration

```typescript
import { provideHttp } from '@melodicdev/core/http';

await bootstrap({
  providers: [
    provideHttp({ baseURL: '/api' }, {
      request: [authInterceptor],
      response: [loggingInterceptor]
    })
  ]
});
```

### Interceptors

#### Request Interceptor

```typescript
const authInterceptor: IHttpRequestInterceptor = {
  async intercept(config) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    return config;
  },
  async error(err) { /* handle */ }
};
```

**Cancel from interceptor:** Set `config.cancel = { cancelled: true, cancelReason: 'Not authorized' }`.

#### Response Interceptor

```typescript
const loggingInterceptor: IHttpResponseInterceptor = {
  async intercept(response) {
    console.log(`${response.status} ${response.config.url}`);
    return response;
  }
};
```

### Request Deduplication

GET requests default to `deduplicate: true`. Identical in-flight requests (same method + URL + body hash) return the same promise.

`RequestManager` tracks pending requests and supports `cancelPendingRequest(key)` and `cancelAllRequests()`.

### Error Handling

```typescript
import { HttpError, NetworkError, AbortError } from '@melodicdev/core/http';

try {
  await http.get('/data');
} catch (e) {
  if (e instanceof HttpError) {
    // Non-2xx response: e.response, e.config, e.code ('HTTP_404', etc.)
  } else if (e instanceof NetworkError) {
    // Network failure: e.code = 'NETWORK_ERROR'
  } else if (e instanceof AbortError) {
    // Request aborted: e.code = 'ABORTED'
  }
}
```

---

## Forms

Source: `src/forms/`. See `docs/FORMS.md` for the full guide.

### AbstractControl

The base class for `FormControl`, `FormGroup`, and `FormArray`. Components that hold an `AbstractControl` instance as a property are automatically subscribed to its `state` signal — no manual `SignalEffect` is required.

### FormControl

```typescript
import { createFormControl, Validators } from '@melodicdev/core/forms';

const email = createFormControl<string>('', {
  validators: [Validators.required, Validators.email],
  updateOn: 'blur'
});

email.setValue('user@example.com');
email.value();   // 'user@example.com' (Signal)
email.valid();   // true (Signal)
email.errors();  // null (Signal)
email.dirty();   // true (Signal)
```

#### Reactive Properties (all Signals)

| Property | Type | Description |
|----------|------|-------------|
| `value` | `Signal<T>` | Current value |
| `errors` | `Signal<ValidationErrors \| null>` | Current errors at this level |
| `valid` / `invalid` | `Signal<boolean>` | Validity state (cascades from children for groups/arrays) |
| `dirty` / `pristine` | `Signal<boolean>` | Changed state (aggregated from children) |
| `touched` / `untouched` | `Signal<boolean>` | Touched state (aggregated from children) |
| `pending` | `Signal<boolean>` | True during async validation |
| `disabled` / `enabled` | `Signal<boolean>` | Disabled state |
| `state` | `Signal<ControlState>` | Composite state object — recommended subscription point |

#### Methods

| Method | Description |
|--------|-------------|
| `setValue(value, options?)` | Set value, mark dirty, validate. `{ markAsPristine: true }` keeps the control pristine (e.g., server hydration) |
| `patchValue(partial, options?)` | Merge into current value. Same `options` as `setValue` |
| `reset(value?)` | Reset to initial or provided value |
| `markAsTouched()` / `markAsUntouched()` | Touch state |
| `markAsDirty()` / `markAsPristine()` | Dirty state |
| `markAllAsTouched()` / `markAllAsUntouched()` | Touch self (cascades in `FormGroup` / `FormArray`) |
| `markAllAsDirty()` / `markAllAsPristine()` | Dirty self (cascades in `FormGroup` / `FormArray`) |
| `disable()` / `enable()` | Disabled state |
| `setValidators(validators)` | Replace sync validators |
| `setAsyncValidators(validators)` | Replace async validators |
| `addValidators(validators)` | Append sync validators |
| `removeValidators(validators)` | Remove by reference |
| `validate()` | Manual validation trigger |
| `hasError(code)` / `getError(code)` | Check/get specific error |
| `destroy()` | Clean up signals |

#### `ControlOptions`

```typescript
type ControlOptions<T> = {
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidatorFn<T>[];
  disabled?: boolean;
  updateOn?: 'change' | 'blur' | 'submit';  // default: 'change'
  messages?: Record<string, string | ((params) => string)>;  // per-control message overrides
};
```

### FormGroup

```typescript
import { createFormGroup, createFormControl, Validators } from '@melodicdev/core/forms';

const form = createFormGroup({
  email: createFormControl('', { validators: [Validators.required, Validators.email] }),
  password: createFormControl('', { validators: [Validators.required, Validators.minLength(8)] })
}, {
  validators: [matchPasswordsValidator],       // Group-level validators
  asyncValidators: [serverValidateForm],       // Group-level async validators
  disabled: false
});

form.value();    // { email: '', password: '' }
form.valid();    // false (includes group-level validation)
form.get('email').setValue('user@example.com');
```

FormGroup uses the same `ControlOptions<T>` as FormControl, where `T` is the aggregate value object type. Group-level validators receive the entire group value object and can validate cross-field constraints (e.g., password confirmation matching). Group `valid` state requires both all children valid AND group-level errors null. The `controls` property is a `Signal` — adding/removing controls automatically re-aggregates state.

### FormArray

Ordered list of controls with `push`, `insert`, `removeAt`, `clear`, `at(index)`, `length`. Same aggregate signal contract as FormGroup. Typically used for repeating control sets (e.g., a list of addresses).

#### Methods

| Method | Description |
|--------|-------------|
| `get(name)` | Get child control |
| `addControl(name, control)` | Add control dynamically |
| `removeControl(name)` | Remove control |
| `contains(name)` | Check existence |
| `setValue(value, options?)` | Set all children. `{ markAsPristine: true }` keeps the form pristine after hydration |
| `patchValue(partial, options?)` | Set only provided children. Same `options` as `setValue` |
| `reset(value?)` | Reset all children |
| `markAllAsTouched()` / `markAllAsUntouched()` | Touch all (cascades into nested groups/arrays) |
| `markAllAsDirty()` / `markAllAsPristine()` | Dirty all (cascades into nested groups/arrays) |
| `disable()` / `enable()` | Disable/enable group + children |
| `validate()` | Validate all children + group validators |

### Validators

All return `ValidationErrors | null`. `null` = valid. Errors are shaped `{ code: string, params?: Record<string, unknown> }` — display messages are resolved separately via the message registry.

| Validator | Signature | Error Code |
|-----------|-----------|------------|
| `Validators.required` | `(value) → errors` | `required` |
| `Validators.minLength(min)` | `(min) → ValidatorFn<string>` | `minLength` |
| `Validators.maxLength(max)` | `(max) → ValidatorFn<string>` | `maxLength` |
| `Validators.pattern(regex)` | `(regex) → ValidatorFn<string>` | `pattern` |
| `Validators.email` | `(value) → errors` | `email` |
| `Validators.min(n)` | `(n) → ValidatorFn<number>` | `min` |
| `Validators.max(n)` | `(n) → ValidatorFn<number>` | `max` |
| `Validators.range(min, max)` | `(min, max) → ValidatorFn<number>` | `range` |
| `Validators.compose(...fns)` | Merge errors from all validators | varies |
| `Validators.composeAsync(...fns)` | Parallel async, merge errors | varies |

#### Validator Edge Cases

- `required` checks for `null`, `undefined`, `''`, and empty arrays
- `minLength` / `maxLength` return `null` for empty strings (only validate non-empty values)
- `min` / `max` / `range` return `null` for `null`/`undefined` values
- Validation flow: sync validators run first; if any fail, async validators are skipped entirely
- Async validators run in parallel via `Promise.all` with stale-result protection

#### Custom Validators

```typescript
import { createValidator, createAsyncValidator } from '@melodicdev/core/forms';

const noSpaces = createValidator<string>(
  'noSpaces',
  (value) => !value.includes(' '),       // true = valid
  'Value must not contain spaces'
);

const uniqueEmail = createAsyncValidator<string>(
  'uniqueEmail',
  async (value) => !(await checkEmailExists(value)),
  (value) => `${value} is already taken`
);
```

### Messages

Validators return `{ code, params? }`; display messages are resolved separately in this order:

1. Per-control `messages` option
2. Walk parent chain checking `messages` on each parent group/array
3. Global default registered via `registerDefaultMessages` or implicitly by `createValidator`
4. Fallback to the `code` string

```typescript
import { registerDefaultMessages } from '@melodicdev/core/forms';

registerDefaultMessages({
  required: 'This is required',
  minLength: ({ min }) => `Must be at least ${min} characters`
});

control.getErrorMessage('required');
control.getFirstErrorMessage();
```

### `:formControl` Directive

Auto-registered attribute directive for two-way binding to any `AbstractControl`. Uses a registered adapter to read/write the bound element.

```html
<input type="text" :formControl=${this.nameControl} />
<select :formControl=${this.countryControl}>...</select>
<ml-input :formControl=${this.emailControl}></ml-input>
```

**Behavior:**
- Resolves an adapter for the element (native input/checkbox/radio/select/textarea pre-registered; ml-* components register their own at import time)
- Pushes control value → element via adapter
- Pushes element input → control value (listens to adapter's `inputEvent`)
- Marks touched on `focusout` (bubbles + composed, so works for both native and custom elements through shadow DOM)
- Toggles CSS classes: `mf-valid`, `mf-invalid`, `mf-dirty`, `mf-pristine`, `mf-touched`, `mf-pending`, `mf-disabled`
- Sets `error` attribute on host with the resolved validator message when control is touched + invalid

### Adapter System

Register custom adapters for any form-bearing element:

```typescript
import { registerAdapter } from '@melodicdev/core/forms';

registerAdapter((el) => el.tagName === 'MY-PICKER', {
  inputEvent: 'my-change',
  blurEvent: 'focusout',
  getValue: (el) => (el as MyPicker).value,
  setValue: (el, value) => { (el as MyPicker).value = value; }
});
```

Predicates check in reverse registration order (latest wins).

---

## Extension Points

### Custom Content Directives

```typescript
import { directive, Directive } from '@melodicdev/core/template';
```

Function-based or class-based. `render(container, previousState)` must return state for next call.

### Custom Attribute Directives

```typescript
import { registerAttributeDirective } from '@melodicdev/core/template';
```

Always return a cleanup function if the directive adds listeners or modifies DOM.

### HTTP Interceptors

Request interceptors can modify config or cancel requests. Response interceptors can transform responses.

### Global Styles

```html
<style melodic-styles>
  /* Adopted into every component's Shadow DOM via adoptedStyleSheets */
</style>

<link rel="stylesheet" melodic-styles href="global.css" />
```

The `applyGlobalStyles` function looks for `<style melodic-styles>` and `<link rel="stylesheet" melodic-styles>` elements in the document. It reads their CSS text, creates `CSSStyleSheet` objects, and applies them via `adoptedStyleSheets` on each component's shadow root. Stylesheets are cached at the module level — subsequent components reuse cached sheets instantly.

### Registering Components

Components self-register via `@MelodicComponent`. Importing the file is sufficient — no separate "global registration" API needed.

---

## Best Practices

Source: `docs/CODING_PRACTICES.md`

### Code Style

- Tabs for indentation, single quotes, `printWidth: 160`, no trailing commas
- `import type` for type-only imports (`verbatimModuleSyntax: true`)
- Always use curly braces around control structures
- Prefer guard clauses over deep nesting
- Use `===` not `==`; prefer `const`, never `var`

### Class Conventions

- `private _camelCase` for properties, `private camelCase` for methods (no underscore prefix on methods)
- `protected camelCase`, `public camelCase`
- Properties before constructor, ordered private → protected → public
- Explicit return types on functions and methods
- Avoid `any`

### Component Conventions

- Prefix non-reactive fields with `_` (excluded from observation)
- Clean up in `onDestroy()` — subscriptions, listeners, timers
- Do **not** query `shadowRoot` in `onInit()` (DOM not yet attached)
- Avoid unnecessary DOM churn; cache computed values when inputs are stable
- Surface actionable errors with context

### Performance

- `_`-prefixed properties bypass reactivity — use for internal state that shouldn't trigger renders
- Signals provide fine-grained reactivity — prefer over plain properties for shared/computed state
- `queueMicrotask` batches multiple property changes into a single render
- `repeat()` with stable keys minimizes DOM mutations via LIS algorithm
- `repeatRaw()` for maximum performance when template overhead matters
- `CompiledTemplate` auto-optimizes simple single-element templates in `repeat()`

### Anti-Patterns

- Don't extend `HTMLElement` directly — use `@MelodicComponent`
- Don't use `any` — use proper types
- Don't query DOM in `onInit()` — use `onCreate()` or `onRender()`
- Don't mutate objects/arrays in place and expect re-renders — create new references
- Don't forget cleanup in `onDestroy()`

---

## Public API Surface

### Import Paths

| Path | Contents |
|------|----------|
| `@melodicdev/core` | Everything (re-exports all sub-modules) |
| `@melodicdev/core/bootstrap` | `bootstrap`, `IAppConfig`, `IMelodicApp`, `Provider` |
| `@melodicdev/core/components` | `ComponentBase`, `MelodicComponent`, `applyGlobalStyles`, lifecycle interfaces |
| `@melodicdev/core/config` | `defineConfig`, `provideConfig`, `APP_CONFIG`, `environment`, `getEnvironment` |
| `@melodicdev/core/signals` | `signal`, `computed`, `SignalEffect`, `isSignal`, `Signal`, `SIGNAL_MARKER` |
| `@melodicdev/core/injection` | `Injectable`, `Inject`, `Service`, `createToken`, `Injector`, `InjectionEngine`, `Binding` |
| `@melodicdev/core/template` | `html`, `css`, `render`, all directives, `TemplateResult`, directive registry functions |
| `@melodicdev/core/routing` | `RouterService`, `RouteContextService`, `RouterOutletComponent`, `RouterLinkComponent`, guards, resolvers, `RouteMatcher` |
| `@melodicdev/core/http` | `HttpClient`, `provideHttp`, error classes, `RequestManager` |
| `@melodicdev/core/forms` | `AbstractControl`, `FormControl`, `FormGroup`, `FormArray`, `createFormControl`, `createFormGroup`, `createFormArray`, `Validators`, `createValidator`, `createAsyncValidator`, `registerAdapter`, `getAdapter`, `registerDefaultMessages`, `formControlDirective` |
| `@melodicdev/core/state` | `createState`, `createAction`, `createReducer`, `onAction`, `provideRX`, `SignalStoreService`, `ComponentStateBaseService`, `EffectsBase` |
| `@melodicdev/core/interfaces` | `INewable<T>` |
