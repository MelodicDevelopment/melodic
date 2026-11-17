# Melodic Framework — Complete Reference

> Auto-generated from source code analysis. Covers every module, class, function, type, and pattern in `@melodicdev/core`. Reflects version 4.0.1 plus the unreleased changes on the current development branch.

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
  - [Interpolated Arrays](#interpolated-arrays)
  - [Built-in Directives](#built-in-directives)
  - [Custom Directives](#custom-directives)
  - [Attribute Directives](#attribute-directives)
  - [Content Projection (Slots)](#content-projection-slots)
- [Reactivity & State](#reactivity--state)
  - [Signals](#signals)
  - [Computed Signals](#computed-signals)
  - [Signal Effects](#signal-effects)
  - [Untracked Reads & Batching](#untracked-reads--batching)
  - [Render Tracking](#render-tracking)
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
  - [Reactive Route State](#reactive-route-state)
  - [Navigation](#navigation)
  - [Guards & Resolvers](#guards--resolvers)
  - [Router Components](#router-components)
- [HTTP Client](#http-client)
  - [HttpClient Class](#httpclient-class)
  - [Interceptors](#interceptors)
  - [Request Deduplication](#request-deduplication)
  - [Error Handling](#error-handling)
- [Forms](#forms)
  - [AbstractControl](#abstractcontrol)
  - [FormControl](#formcontrol)
  - [FormGroup](#formgroup)
  - [FormArray](#formarray)
  - [Validators](#validators)
  - [Messages](#messages)
  - [`:formControl` Directive](#formcontrol-directive)
  - [`:model` Directive](#model-directive)
  - [Adapter System](#adapter-system)
- [Testing](#testing)
- [Dev Mode & DevTools](#dev-mode--devtools)
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
  // devMode: true | false forces dev mode; omit it to follow the build
  onBefore: async () => { /* pre-boot async work */ },
  onReady: () => { /* post-boot sync work */ },
  onError: (error, context) => { /* global error handler */ }
});
```

#### `IAppConfig` Interface

| Field | Type | Description |
|-------|------|-------------|
| `providers` | `Provider[]` | DI provider functions |
| `devMode` | `boolean` | Sets the framework-wide dev-mode switch: template diagnostics, dev warnings, the `window.melodic` console API and `[Melodic]` bootstrap logging. Left unset it follows the build (see [Dev Mode & DevTools](#dev-mode--devtools)) |
| `onError` | `(error: Error, context: 'error' \| 'unhandledrejection') => void` | Global handler for `window` error/unhandledrejection |
| `onBefore` | `() => void \| Promise<void>` | Async hook before providers register |
| `onReady` | `() => void` | Sync hook after everything initializes |
| `rootComponent` | `string` | Tag name of root custom element |
| `target` | `string \| HTMLElement` | Mount target (selector or element) |

Every field is optional (`bootstrap(config = {})`). The root component is mounted only when **both** `rootComponent` and `target` are given.

#### `Provider` Type

```typescript
type Provider = (injector: InjectionEngine) => void;
```

#### `IMelodicApp` Interface

```typescript
interface IMelodicApp {
  isDevMode: boolean;
  get<T>(token: Token<T>): T;    // Shortcut to Injector.get()
  http?: HttpClient;              // The bound HttpClient, when provideHttp() was used
  rootElement?: HTMLElement;
  destroy(): void;                // Idempotent. Removes error handlers and the root element, runs
                                  // provider teardowns, and releases the 'IMelodicApp' binding
}
```

`app.destroy()` runs the teardowns this app's providers registered with `injector.addTeardown(fn)` **after** the root element is removed, so components tear down against live services. `provideRouter()` registers one that removes the router's window listeners and restores `history.scrollRestoration`.

#### Bootstrap Execution Order

1. Apply `devMode` to the framework-wide switch (if provided); in dev mode install `window.melodic`
2. Attach global error handlers (if `onError` provided)
3. `await onBefore()` (if provided)
4. Register all providers — each receives the global `Injector`
5. If `rootComponent` and `target` are both set: resolve `target` (throws if not found), verify `rootComponent` is registered via `customElements.get()` (throws if not), then `document.createElement(rootComponent)` → append to `target`
6. Build the `IMelodicApp` instance; `app.http` is set when an `HttpClient` is bound
7. Bind app as `'IMelodicApp'` value in DI container
8. Call `onReady()` (if provided) — the app is already resolvable via `Injector.get('IMelodicApp')`
9. Return `IMelodicApp`

If any step throws, bootstrap rolls back what it acquired (window error handlers, provider teardowns, the mounted root element, the `'IMelodicApp'` binding) and rethrows.

**Bootstrap is optional** — components work without it if DI bindings are registered manually.

---

### Component System

Source: `src/components/`

Components use the `@MelodicComponent` decorator and are plain classes — they never extend `HTMLElement` directly. The framework uses a **two-object pattern**: a `ComponentBase` (extending `HTMLElement`) wraps a separate user-class instance.

TypeScript requirements: `experimentalDecorators: true` and `useDefineForClassFields: false`. `emitDecoratorMetadata` is **not** required — nothing in the framework reads `design:*` metadata.

#### `@MelodicComponent` Decorator

```typescript
@MelodicComponent({
  selector: 'my-component',
  template: myTemplate,
  styles: myStyles,
  attributes: ['my-attr']   // or { open: 'boolean', offset: 'number' }
})
export class MyComponent {
  elementRef!: HTMLElement;  // assigned by the framework: the host custom element
  count = 0;
  // ...
}
```

#### `ComponentMeta` / `TypedComponentMeta<C>`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `selector` | `string` | Yes | Custom element tag name |
| `template` | `(component, attributes?) => TemplateResult` | No | Template function. `attributes` (a snapshot of the host's attributes) is only built when the function declares the second parameter |
| `styles` | `() => TemplateResult` | No | Styles via `css` tagged template |
| `attributes` | `string[] \| Record<string, 'boolean' \| 'number' \| 'string'>` | No | HTML attributes to observe, optionally with their coercion type |

#### What the Decorator Does

1. Validates `selector` — **throws** when it is missing, has no hyphen, does not start with a lowercase letter, contains uppercase or whitespace, or is a reserved name (`font-face`, `annotation-xml`, …)
2. Dev-mode warnings: an observed attribute name containing an uppercase letter (it can never fire), an observed attribute that maps to a method, and a second class registering under an existing selector (the first registration wins)
3. If the selector is not yet defined: creates an anonymous class extending `ComponentBase`
4. In its constructor: resolves `@Inject` dependencies from the global `Injector`, constructs the user class with them (`Reflect.construct`, inside the component's ownership scope and untracked), then calls `super(meta, instance, scope)`
5. Sets `static observedAttributes` from `meta.attributes` (either form)
6. Calls `customElements.define(selector, webComponent)`
7. Records the registration — `getComponentDefinitions()` / `getComponentDefinition(selector)` return `{ selector, componentClass, meta }`

#### `ComponentBase` Constructor Flow

1. `super()` — `HTMLElement` constructor
2. Store meta and component references
3. `component.elementRef = this` — gives user class access to the DOM element
4. Seed attribute coercion types from the `attributes` map and from `static propertyTypes`
5. `attachShadow({ mode: 'open' })` — always open Shadow DOM
6. `applyGlobalStyles(shadowRoot)` — adopt document-level `<style melodic-styles>` sheets
7. `renderStyles()` — adopt one shared constructed `CSSStyleSheet` per component class via `adoptedStyleSheets` (falls back to a per-instance `<style>` element where constructed stylesheets are unsupported)
8. `observe()` — set up reactive property observation
9. Call `component.onInit()` if defined

Steps 8 and 9 run inside the component's ownership scope and untracked, so resources created there belong to this component and signal reads there never subscribe a parent's render.

#### Host Element API

The custom element (`elementRef`) is a `ComponentBase`. Besides the mirrored properties (see [Component Property Reactivity](#component-property-reactivity)) it exposes:

| Member | Description |
|--------|-------------|
| `component` | The user's component instance |
| `selector` | The component's selector |
| `isRendering` | `true` while the template is executing |
| `requestRender()` | Queue a re-render. Reactive fields and signals read in the template do this automatically; call it when something the template reads changed outside the reactive graph |

#### Observed Attributes & Coercion

An observed attribute is written to the camelCase property of the same name (`my-attr` → `myAttr`). The value is coerced by the property's type, determined in this order:

1. The `attributes` map (`{ open: 'boolean' }`) or `static propertyTypes = { open: 'boolean' }` on the class (`propertyTypes` wins on conflict)
2. The type of the property's initial value
3. The type of the property's current value

| Type | Coercion |
|------|----------|
| `boolean` | Present with any value except the literal `"false"` → `true`; absent → `false` |
| `number` | Numeric strings → `Number`; a removed attribute (`null`), an empty string and non-numeric text pass through unchanged (never `NaN`) |
| `string` (declared) | Never coerced |
| unknown (property is `undefined`/`null`) | `"true"` / `"false"` → boolean; anything else passes through as the raw string |

The map form is the only way to type a property with no initializer (`open?: boolean`). An attribute write that coerces to the value the property already holds (`Object.is`) does not re-render.

---

### Lifecycle Hooks

All hooks are optional. Implement only what you need.

```typescript
interface ILifeCycleHooks {
  onInit?(): void;
  onCreate?(): void;
  onConnect?(): void;
  onDisconnect?(): void;
  onRender?(): void;
  onDestroy?(): void;
  onAttributeChange?(attribute: string, oldVal: unknown, newVal: unknown): void;
  onPropertyChange?(property: string, oldVal: unknown, newVal: unknown): void;
}

// Routed components may additionally implement (from '@melodicdev/core/routing'):
interface IRouteChangeAware {
  onRouteChange?(change: IRouteChange): void;
}
```

| Hook | When |
|------|------|
| `onInit()` | In the constructor, after property observation, before DOM attachment |
| `onCreate()` | Once — the first time the element enters the DOM, after the first render |
| `onConnect()` | Every connect, including the first (after `onCreate`) |
| `onRender()` | After every render, including the initial one |
| `onDisconnect()` | Every disconnect |
| `onDestroy()` | Permanent removal only — teardown is deferred one microtask after disconnect and cancelled by a reconnect |
| `onAttributeChange(attribute, oldVal, newVal)` | An observed attribute changed (raw attribute values) |
| `onPropertyChange(property, oldVal, newVal)` | A reactive property is about to change |
| `onRouteChange(change)` | A routed component stayed mounted while its route params, the query string or its resolved data changed (`/users/1 → /users/2`, `?q=a → ?q=b`) — see [Router Components](#router-components) |

#### Complete Execution Order

```
constructor:
  1. Shadow DOM attached (mode: 'open')
  2. Global styles applied (adoptedStyleSheets)
  3. Component styles adopted (shared constructed stylesheet)
  4. Property observation established (Object.defineProperty getters/setters)
  5. onInit()

connectedCallback (every connect):
  6. Pending teardown cancelled; signal/control field subscriptions (re)established
  7. render() — template evaluated inside the render effect, DOM patched
  8. onRender() — post-render hook
  9. onCreate() — first connect only
  10. onConnect() — every connect

[Property changes]:
  11. onPropertyChange(name, oldVal, newVal) — synchronous, BEFORE the value is stored,
      only when the value actually changed (Object.is)
  12. scheduleRender() → (microtask) render() → onRender()

[Attribute changes]:
  13. Coerced value assigned to the camelCase property (step 11 applies) and a render is
      scheduled — both skipped when the coerced value is unchanged
  14. onAttributeChange(attribute, oldVal, newVal) — synchronous, before the scheduled render
  15. (microtask) render() → onRender()

[A signal read by the template changes]:
  16. scheduleRender() → (microtask) render() → onRender()

disconnectedCallback (every disconnect):
  17. Signal/control field subscriptions removed
  18. onDisconnect()
  19. Teardown queued on a microtask — cancelled if the element reconnects first

teardown (permanent removal):
  20. Render effect destroyed; rendered part tree disposed (directive cleanups, event listeners)
  21. onDestroy()
  22. Owned resources destroyed (computeds, effects, form controls, store selects)
```

**Key details:**
- `onPropertyChange` fires **before** the new value is stored
- `onInit` fires before DOM attachment — do not query `shadowRoot` here
- `onRender` fires after every render, including the initial one
- A component renders **once** on mount: attribute writes and `.prop=` bindings made before connect do not produce a second render
- `onCreate` runs once; put repeatable setup in `onConnect` and its paired teardown in `onDisconnect`
- Moving an element in the DOM (re-parenting it, or removing and synchronously re-adding it) does **not** destroy it: `onDisconnect` and `onConnect` fire, `onDestroy` does not, and component state survives
- **Hooks are not signal-tracked.** Every lifecycle hook runs untracked — including `onPropertyChange`, which fires synchronously inside the property write. Signal reads inside a hook belong to your code, not to the render, and never subscribe the component (or a parent) to that signal
- **Resource ownership:** `computed()`, `effect()`, form controls and `store.select()` results created in a field initializer, `onInit`, `onCreate` or `onConnect` are destroyed automatically with the component. Clean up anything else (manual `subscribe()` calls, DOM listeners, timers) in `onDestroy()` — or `onDisconnect()` when it was set up in `onConnect()`
- A throwing `onDestroy`/`onDisconnect` does not prevent framework cleanup
- **Re-attaching after teardown revives the element.** An element attached again after its teardown ran gets its template, handlers and field subscriptions back, and `onConnect` fires; `onCreate` does not run again and `onDestroy` still fires only once per component. The computeds, effects, form controls and store selections it owned were destroyed and are not recreated — reading one throws — so dev mode warns (`reconnect-after-destroy`). Prefer creating a new element
- **Moving to another document keeps styles.** `adoptedCallback` rebuilds the component and global stylesheets for the new document (an iframe, a new window), falling back to a `<style>` element where that document cannot construct sheets
- **Render loops are stopped.** A component that renders 25 times within one macrotask (typically a property or signal written from `onRender` or from the template itself) is halted and reported with `console.error`. Because a burst of legitimate updates looks the same, one catch-up render is granted after the task ends; a real loop trips the guard again during it and stays stopped

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
// handleClick = () => { … } — an arrow-function field (or use @click=${() => component.handleClick()}):
// a function handler is called with `this` set to the element, not the component

const myStyles = () => css`
  :host { display: block; }
  .greeting { color: var(--ml-color-text); }
`;
```

`html` and `css` are separate tags; both return a `TemplateResult` (`css` returns an internal subclass). The text of a `css` template is used verbatim as the stylesheet — it is not parsed as HTML, so entities are not decoded and nothing that looks like a tag is stripped (`content: "<b>"` stays as written). Interpolated values are inserted as text, and one `css` result can be nested in another.

### Binding Types

| Syntax | Type | Example | Behavior |
|--------|------|---------|----------|
| `${value}` | Text interpolation | `<p>${name}</p>` | Sets `textContent`; handles directives, nested templates, arrays, nodes |
| `@event=${handler}` | Event binding | `@click=${this.onClick}` | `addEventListener`/`removeEventListener`; accepts a function or a `handleEvent` object with listener options |
| `.property=${value}` | Property binding | `.value=${inputVal}` | Direct `element[prop] = value`, skipped when the bound value is unchanged (see [`live()`](#livevalue)) |
| `attribute=${value}` | Attribute binding | `class=${cls}` | `setAttribute`/`removeAttribute`; supports composite attrs |
| `?attribute=${bool}` | Boolean attribute | `?disabled=${isOff}` | Adds/removes attribute based on truthiness |
| `:directive=${value}` | Action directive | `:routerLink=${path}` | Invokes registered attribute directive |

A binding is an attribute/event/property binding only when it sits inside an open tag; anywhere else it is text, so `` html`<p>Total=${n}</p>` `` renders the value. Quoted forms (`@click="${h}"`, `.value="${v}"`, `?disabled="${b}"`) are equivalent to the unquoted ones.

Bindings on one element commit in **source order**, so write order-sensitive ones in the order the platform needs: `<input type="range" max=${200} .value=${150}>` sets `max` before `value`.

#### Attribute Binding Details

- `null`, `undefined`, `false` → removes attribute
- `true` → sets empty attribute (`setAttribute(name, '')`)
- `aria-*` attributes bound to a boolean are written as the literal strings `"true"` / `"false"` (ARIA state semantics), never removed
- **Composite attributes**: `class="prefix-${a}-${b}"` — multiple interpolations in one attribute, assembled from static/dynamic segments. A directive in a composite attribute keeps the other segments: `class="card ${classMap({ active })}"` renders `class="card active"`

#### Node Interpolation Details

- **Directive** (`__directive: true`): calls `value.render(node, previousState)`
- **`TemplateResult`**: nested rendering with persistent `DocumentFragment` for in-place updates
- **DOM `Node`**: inserted between start/end markers
- **Array**: keyed reconciliation (when every item is keyed) or index-based reuse — see [Interpolated Arrays](#interpolated-arrays)
- **Primitive**: `String(value ?? '')`

#### Unsupported Binding Positions

The parser cannot track a binding inside `<textarea>` or `<title>` content, inside an HTML comment, or in tag-name position (`<${tag}>`). These never throw; in dev mode the offending template snippet is reported with `console.warn`, as is a binding whose marker was swallowed by an unbalanced quote. Binding `.innerHTML` / `.outerHTML` also warns once in dev mode (XSS hazard) — prefer text interpolation or `unsafeHTML()`.

Two more dev-only advisories cover attribute bindings that can execute script; neither is blocked: `attr-javascript-url` when a `javascript:` URL is written to `href`, `src`, `action`, `formaction` or `xlink:href`, and `attr-inline-handler` when a string is written to an inline event-handler attribute (`onclick=${…}`) — use an `@event` binding instead.

### Template Caching & Parse-Once Strategy

1. **First render into a container**: parses the HTML string with markers (once per template), creates a `<template>` element, identifies dynamic "parts", caches the structure, clones it and commits the values
2. **Subsequent renders into the same container**: no clone — the stored parts are committed and only values that changed (`===`) touch the DOM. A structurally different template disposes the old part tree and rebuilds

Parsed templates are cached by template literal identity: a `WeakMap` keyed on the literal's `TemplateStringsArray`, which a tagged template passes unchanged on every evaluation, so a template is never re-parsed however many others are in use. A secondary 500-entry LRU keyed by template text only de-duplicates distinct literals with equal text. Part paths are pre-computed for direct node access without DOM tree walks.

### Interpolated Arrays

A plain array in a binding — `${items.map(item => html`…`)}` — is reused **by index** across renders: index `i` updates the nodes created for index `i` last time, growth appends, shrinkage disposes the tail, and a value whose type changed rebuilds only that index. Node identity is preserved, which keeps focus, selection, scroll position, transitions and `mousedown`→`mouseup` click sequences intact.

Index-based reuse has no notion of item identity — use `repeat()` for lists that reorder, sort, filter, or take insertions anywhere but the end. Dev builds log a one-time advisory when an array actually churns (several items rebuilt in one update), and when an array mixes keyed and unkeyed items.

Each item is bounded by its own `<!--item-start-->` / `<!--item-end-->` comment pair (as `repeat()` items are). Code that walks `childNodes` around an interpolated array sees those comments; `children` and `querySelector*` are unaffected.

> Changed in 3.1.0: unkeyed arrays previously rebuilt their entire subtree on every render. See `docs/TEMPLATE_SYSTEM.md` for the migration notes.

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

- Signature: `repeat<T>(items: T[], keyFn: (item: T, index: number) => unknown, template: (item: T, index: number) => TemplateResult)`
- **Fast path**: same key order → in-place template updates, no reconciliation
- Each item bounded by comment markers for efficient range operations
- `keyFn` is called once per item per render
- **Keys must be unique** per item (an id, not an index into a filtered list). Old items are tracked in per-key queues, so a duplicate key does not strand DOM, but dev mode warns about it

`repeat()`, `when()` and `unsafeHTML()` recover from a callback that throws on their **first** render (a `keyFn`, an item template or a branch reading a property of `undefined`): the binding is restored, so the next render starts from scratch instead of failing forever.

#### `repeatRaw(items, keyFn, factory, update?)`

> **Deprecated — prefer `repeat()`.** `repeatRaw` re-appends every element whenever a key is added, removed or moved (it has no minimal-move reconciliation), and the elements it creates get no bindings or cleanup from the template engine. It keeps working and is not scheduled for removal.

List rendering with raw DOM APIs, bypassing the template system entirely.

```typescript
import { repeatRaw } from '@melodicdev/core';

html`${repeatRaw(
  items,
  (item) => item.id,
  (item) => {
    const el = document.createElement('li');
    el.textContent = item.name;
    return el;
  },
  (el, item) => { el.textContent = item.name; }   // optional
)}`
```

- `factory: (item, index) => Element` creates the element for an item
- Without `update`, `factory` runs for every item on every render and the element it returns replaces the previous one for that key
- With `update: (element, item, index) => void`, elements for keys seen before are updated in place and keep their DOM identity (focus, scroll position, animations); `factory` then only runs for new keys

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

Converts camelCase to kebab-case. Sets via `style.setProperty()`, removes via `style.removeProperty()`. A custom property key (`'--rowHeight'`) is passed through exactly as written — custom property names are case-sensitive.

**Units are never inferred.** Values are emitted as-is, so a bare number on a length property produces invalid CSS that the browser drops silently — no error, no style. Unlike React's style object, `styleMap` does not append `px`:

```typescript
styleMap({ left: 42 })          // ✗ emits "left: 42" — invalid, silently ignored
styleMap({ left: `${x}px` })    // ✓
```

Bare numbers are still correct for unitless properties such as `opacity`, `zIndex`, `flexGrow`, and `lineHeight`.

#### `unsafeHTML(htmlString)`

```typescript
html`<div>${unsafeHTML(rawHtml)}</div>`
```

Renders raw HTML. Skips update if string is unchanged. **Only use with trusted content.**

#### `live(value)`

Binds a property against the element's **current** value instead of the last value the template wrote.

```typescript
import { live } from '@melodicdev/core';

html`<input .value=${live(this.text)} @input=${this.onInput} />`
```

A plain property binding skips the write when the bound value is unchanged. That is wrong for a control the user can edit: after typing, resetting `text` to the value it already held writes nothing and the typed text stays on screen. `live()` compares with the element's live property (also by string form, so a numeric binding does not rewrite a string `.value` on every render) and writes only when they differ. Use it for `value`, `checked`, `selected` and similar user-mutable properties; a plain binding is cheaper everywhere else.

#### `portalDirective`

The `:portal` attribute directive. Teleports its element to a different DOM location, leaving a comment placeholder behind.

```html
<div :portal="body">This renders in <body></div>
<div :portal=${containerElement}>Dynamic target (selector string or Element)</div>
<div :portal=${{ target: '#modal-root', persist: true }}>Persists after unmount</div>
```

Value: `string | Element | { target: string | Element; persist?: boolean }`. On cleanup the element is removed from the target unless `persist` is `true`.

### Custom Directives

#### Function-based

```typescript
import { directive } from '@melodicdev/core/template';

const highlight = (color: string) => directive((container: Node, prevState?: any) => {
  const el = container as HTMLElement;
  el.style.backgroundColor = color;
  return null; // return state for next render
}, 'highlight');

// Usage: html`<p style=${highlight('yellow')}></p>`
```

`directive(renderFn, type?)`:

- `renderFn(container, previousState, name?)` — `container` is the node the binding sits on: the element for an attribute or property binding (`name` is then the bound attribute/property name), or an empty placeholder text node for a text-position binding (`when`/`repeat` replace it with a comment-marker range)
- `type` (optional `string | symbol`) identifies the directive. When a binding switches between two directives with different `type`s, the old state is disposed instead of being handed to the new directive. Untyped directives are all treated as the same directive
- State returned by `renderFn` may implement `__dispose()` (see `IDirectiveState`): the engine calls it when the directive's content is discarded — on removal by a parent, when the binding switches to another directive or a plain value, and on host teardown. It must be idempotent and must not remove DOM nodes

#### Class-based

```typescript
import { Directive } from '@melodicdev/core/template';

class MyDirective extends Directive {
  render(container: Node, previousState?: any): any {
    // ...
    return newState;
  }
}

// Usage: html`<p title=${new MyDirective()}></p>`
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

A directive function is `(element: Element, value: unknown, name: string) => (() => void) | void`. With a dynamic value it re-runs whenever the bound value changes (the previous cleanup runs first); with a static value (`:tooltip="text"`) it runs once. The cleanup also runs when the element's template is disposed.

**Built-in attribute directives:** `portal`, `routerLink` (auto-registered on routing import), `formControl` and `model` (auto-registered on forms import)

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
  set(value: T): void;         // Set (notifies unless Object.is(value, oldValue))
  update(updater: (current: T) => T): void;
  subscribe(subscriber: (value: T) => void): () => void;
  unsubscribe(subscriber: (value: T) => void): void;
  destroy(): void;              // Clear all subscribers and dependents
};
```

- `signal(initialValue, options?)` — `options.name` labels the signal in error messages and DevTools. `signal<T>()` with no argument returns `Signal<T | undefined>`.
- **Equality check**: `Object.is`. Object/array mutations without a new reference won't trigger updates.
- **Writes are two-phase.** `set()` first invalidates every transitive dependent (computeds become dirty, effects are queued) and only then runs anything, so a consumer reading several derived values always sees a consistent set. Outside a `batch()` the execute phase runs synchronously inside `set()`; inside one it is deferred until the outermost batch closes.
- **Subscriber errors surface to the writer.** Every subscriber and effect still runs; the failure is rethrown from `set()` afterwards (an `AggregateError` when several threw).
- `subscribe()` does not call the subscriber immediately — it fires on the next change.
- Reading, writing or subscribing to a **destroyed** signal throws. A signal created by a component's resources (a `computed`, a form control, a `select()`) is destroyed with that component — do not cache it on a long-lived service.
- Tagged with `SIGNAL_MARKER` symbol for identification via `isSignal()`.

### Computed Signals

```typescript
import { computed } from '@melodicdev/core/signals';

const doubled = computed(() => count() * 2);
doubled(); // Re-evaluates on the next read after count changed
```

- Signature: `computed<T>(computation: () => T, options?: { name?: string }): ReadonlySignal<T>`
- **Lazy**: the computation does not run at creation, nor when a source changes — it runs on the next read after a source changed (dirty flag). Reads inside a `batch()` reflect writes made earlier in that batch.
- **Read-only**: `ReadonlySignal<T>` keeps `set`/`update` for structural compatibility with `Signal<T>`, but calling either **throws**. Update the source signal(s) instead.
- Dependencies are auto-tracked — reading a signal inside the computation subscribes to it, and they are re-tracked on every recompute
- Computed signals chain — a computed can depend on other computed signals. A computed whose computation reads itself (directly or through another computed) throws a "Circular dependency detected in computed" error that names it
- A computation that throws propagates the error to the reader, and the computed stays subscribed: the next source change is still propagated, so a dependent effect or template recovers once the source is corrected
- Effects (and component renders) that depend on a computed are woken when a source changes even if the recomputed value turns out equal; direct `subscribe()` callbacks are equality-gated (`Object.is`)
- **Ownership**: created while a component is constructing or running `onInit`/`onCreate`/`onConnect`, a computed is destroyed with that component. Elsewhere the caller owns it (`destroy()`)
- **Do not create a `computed()` in a template** (or in a getter the template reads): a new one is created on every render and each lives until the component unmounts. Dev mode warns. Create it in a field initializer or `onInit`, or use `store.select(key, fn, cacheKey)`, which is render-scoped

### Signal Effects

#### `effect()`

```typescript
import { effect } from '@melodicdev/core/signals';

const ref = effect(() => {
  document.title = `${unread()} unread`;
});

// Cleanup: runs before each re-run and once on destroy
effect(() => {
  const id = setInterval(poll, interval());
  return () => clearInterval(id);
});

ref.destroy();
```

`effect(fn: () => void | (() => void), options?: IEffectOptions): IEffectRef`

- Runs `fn` **immediately**, then again whenever a signal it read changes
- A function returned from `fn` is a cleanup, run before the next run and on destroy
- `options.name` — label for error messages and DevTools
- `options.manual` — skip the immediate first run; the effect tracks nothing until `ref.run()` is called
- `IEffectRef`: `run()` (re-run now), `destroy()`, `destroyed`
- **Ownership**: created inside a component (field initializer, `onInit`, `onCreate`, `onConnect`) it is destroyed with that component. Elsewhere the caller must call `destroy()`

#### `SignalEffect` (low-level)

`effect()`, `computed()` and the component render tracker are built on `SignalEffect`. Prefer `effect()` in application code.

```typescript
import { SignalEffect } from '@melodicdev/core/signals';

const fx = new SignalEffect(() => {
  console.log('Count changed:', count());
}, { name: 'log-count' });
fx.run();  // Initial run + subscribes to count

// Later:
fx.destroy();  // Unsubscribes from all dependencies, cancels any queued run
```

- Constructor: `new SignalEffect(execute, options?)` with `options.name` and `options.onInvalidate` (called *instead of* scheduling a run when a tracked source changes)
- `run()` — the **first** run always executes synchronously, even inside a batch; later calls made during a batch are coalesced into one run. `run` is a stable bound function reference
- `runNow()` executes immediately, bypassing batch coalescing; `clearDependencies()` detaches from every source without destroying; `hasRun` / `destroyed` getters
- **Dependencies fully re-tracked on every execution** — conditional reads auto-unsubscribe
- **Re-entrancy protection** — an effect that writes a signal it reads re-runs; more than 100 synchronous re-runs throws a "Circular dependency detected" error
- **Nested effects supported** — previous active effect saved/restored (stack behavior)

### Untracked Reads & Batching

```typescript
import { untracked, batch } from '@melodicdev/core/signals';

effect(() => {
  // re-runs when `query` changes, but not when `page` does
  search(query(), untracked(() => page()));
});

batch(() => {
  first.set('Ada');
  last.set('Lovelace');
}); // subscribers and effects run once, after the batch
```

- `untracked<T>(fn: () => T): T` — runs `fn` with dependency tracking off, so the surrounding effect, computed or component render does not subscribe to signals read inside it
- `batch<T>(fn: () => T): T` — defers subscriber notifications and effect runs until `fn` returns (nested batches flush when the outermost completes). Writes are visible to reads — including computed reads — made later in the same batch

### Render Tracking

A component's template runs inside a signal effect, so **every signal read while rendering** re-renders the component when it changes:

- a signal held in a component field
- a signal on an injected service (`this._auth.user()`)
- a signal nested inside an object or array
- a `computed()` from anywhere, a store `select()`, a form control's `value()`/`state()`, `router.params()`

```typescript
@MelodicComponent({
  selector: 'user-badge',
  template: (c: UserBadge) => html`<span>${c.auth.user()?.name ?? 'Guest'}</span>`
})
class UserBadge {
  @Service(AuthService) auth!: AuthService;   // auth.user is a signal on the service
}
```

- The dependency set is rebuilt on every render — a signal read only in a branch that is no longer rendered stops triggering renders
- A change never renders synchronously: it schedules the normal microtask render (see [Render Batching](#render-batching))
- Reads inside lifecycle hooks (including `onRender`, which runs right after the template) are **not** tracked — see [Lifecycle Hooks](#lifecycle-hooks)
- Wrap a read you do not want tracked in `untracked()`
- A getter-only accessor on the component (`get fullName()`) that reads signals is tracked the same way when the template reads it

### Component Property Reactivity

The `observe()` method in `ComponentBase` sets up reactivity via `Object.defineProperty`:

1. Collects all own properties from the component instance and prototype chain
2. **Skips**: `_`-prefixed properties, functions, `elementRef`, `constructor`
3. For each remaining data property: defines getter/setter on both the component and the HTMLElement wrapper
   - **Setter**: when the value changed (`Object.is`), calls `onPropertyChange(prop, oldVal, newVal)`, updates the value, calls `scheduleRender()`
   - **Getter**: returns cached value (or calls original getter if one existed)
4. For `Signal`-typed fields: subscribes to the signal → `scheduleRender()` on change
5. For `AbstractControl`-typed fields (FormControl, FormGroup, FormArray): subscribes to the control's `value` and `state` signals → `scheduleRender()` on change
6. Getter-only accessors (`get total()`) and `@Service` fields are not reactive data; public ones are surfaced on the host element as lazy read-only passthroughs
7. Function-valued fields (`formatter = (x) => x`), signal/control fields and every observed-attribute property (even one with no initializer) are exposed on the host as passthroughs, so a parent's `.prop=${value}` reaches them. Prototype methods stay off the host

**Properties are mirrored** on both the component instance and the HTMLElement wrapper, enabling `.property=${value}` bindings.

A write to a passthrough (step 7) is ignored when the value is unchanged (`Object.is`); otherwise:

| Field holds | Value bound | Result |
|-------------|-------------|--------|
| a signal | a plain value | `signal.set(value)` — the signal itself is kept. A read-only signal (a `computed`) ignores the write with a dev warning (`host-write-readonly`) |
| a signal | another signal | The field is replaced by the bound signal |
| a form control | another `AbstractControl` | The field is replaced by the bound control |
| a form control | anything else | Ignored, with a dev warning (`host-write-control`) |
| a function, or an observed-attribute property | anything | Assigned to the field; a render is scheduled |

A value bound to a property the component does not declare at all — typically a field with no initializer that is not an observed attribute — never reaches the component. Dev mode reports it (`unknown-prop`).

- **Reassignment is followed.** Assigning a new signal or control to a field (`this.form = createFormGroup(...)`) fires `onPropertyChange`, swaps the subscription to the new source and re-renders
- Field subscriptions (steps 4–5) are active only while the element is connected. They are a fallback for reads outside the template — any signal the template reads is already tracked by [Render Tracking](#render-tracking)
- **Native property names are not mirrored.** A field named like an `HTMLElement` property (`hidden`, `title`, `id`, `slot`, `dir`, `tabIndex`, …) stays reactive inside the component but is not defined on the host: `element.hidden` reads and writes the platform property, not the field. Dev mode warns; rename the field
- In-place mutation of an object or array field (`this.items.push(x)`) is not detected — assign a new reference

### Render Batching

```typescript
private scheduleRender(): void {
  this._dirty = true;
  if (this._renderScheduled) return;
  this._renderScheduled = true;
  queueMicrotask(() => {
    this._renderScheduled = false;
    if (this.isConnected && this._dirty) this.render();   // render() clears _dirty
  });
}
```

Multiple synchronous property changes or signal updates produce a **single render** on the next microtask. A render that already happened in the meantime (the synchronous one in `connectedCallback`) clears the dirty flag, so a component renders once on mount rather than twice.

---

## Props & Data Flow

### Passing Props into Components

Components receive data through two mechanisms:

**1. Property bindings** (`.property=${value}` in templates):

```typescript
html`<user-card .user=${currentUser} .showAvatar=${true}></user-card>`
```

Property bindings set values directly on the custom element. Because `observe()` mirrors getter/setter pairs on both the component instance and the HTMLElement wrapper, `.property` bindings on the host element trigger the same reactivity pipeline (change detection → `onPropertyChange` → `scheduleRender`). The target must be a property the component declares: a field with an initializer (`user: User | null = null`; `= undefined` is enough), or an observed attribute's property. Under `useDefineForClassFields: false` a field declared without an initializer is never created, so a binding to one that is not an observed attribute is ignored — dev mode warns (`unknown-prop`). The name must not be that of a native `HTMLElement` property. Function-valued, signal and form-control fields are reachable too; see [Component Property Reactivity](#component-property-reactivity) for how a write to each is applied.

**2. HTML attributes** (`attribute=${value}` in templates):

```typescript
html`<user-card name=${userName} role="admin"></user-card>`
```

Observed attributes (listed in `@MelodicComponent({ attributes })`, as a list or a typed map) are automatically synced to camelCase properties on the component via `attributeChangedCallback`. Kebab-case attributes map to camelCase properties (e.g., `my-attr` → `myAttr`). Values are coerced by the property's type — booleans (any value except the literal `'false'` is `true`; absent is `false`) and numbers; see [Observed Attributes & Coercion](#observed-attributes--coercion).

**Key difference:** Property bindings pass JavaScript values (objects, arrays, functions). Attribute bindings pass strings only. Use `.property` for complex data, `attribute` for simple strings/numbers/booleans.

### Parent-Child Communication

**Parent → Child:** Property bindings (`.property=${value}`) and attribute bindings as described above.

**Child → Parent:** Custom DOM events dispatched from the child with `emit()`, handled with `@event` bindings on the parent:

```typescript
import { emit } from '@melodicdev/core';

// Child component
emit(this.elementRef, 'user-selected', { userId: this.selectedId });

// Parent template
html`<user-list @user-selected=${(e) => this.handleSelection(e.detail)}></user-list>`
```

`emit()` defaults to `bubbles: true` and **`composed: true`** — without `composed`, events stop at the Shadow DOM boundary and the parent never sees them. See [Custom Events](#custom-events).

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

// Component B — re-renders when selectedId changes, because its template reads the signal
@Service(SelectionService) private _selection!: SelectionService;
get selectedId() { return this._selection.selectedId(); }
// template: (c) => html`<p>Selected: ${c.selectedId}</p>`
```

Any signal read while a template renders is tracked (see [Render Tracking](#render-tracking)), so a signal on a shared service needs no per-component wiring.

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

**How it works internally:** The template engine stores event bindings as `'event'` parts. Each part registers one stable wrapper listener on the element via `addEventListener` and keeps it for the part's lifetime:
- A new handler reference only swaps the function the wrapper calls — the DOM listener is not removed and re-added, so an inline arrow in a template is cheap
- If the handler reference is identical, no work is done
- A non-function value (`null`, `undefined`) detaches the listener
- A function handler is called with `this` set to the element (direct-listener semantics), so pass an arrow function or a bound method when the handler needs the component

**Listener options:** bind an object with `handleEvent` plus any of `capture`, `once`, `passive`. Changing an option re-attaches the listener.

```typescript
html`<div @scroll=${{ handleEvent: (e: Event) => this.onScroll(e), passive: true }}></div>`
```

**All standard DOM events** are supported — `click`, `input`, `change`, `submit`, `keydown`, `mouseenter`, `focus`, `blur`, custom events, etc.

### Custom Events

Components emit custom events with `emit()`:

```typescript
import { emit } from '@melodicdev/core';

// In a component method
emit(this.elementRef, 'value-change', { value: this.currentValue });
```

`emit<T>(host: EventTarget, name: string, detail?: T, options?: IEmitOptions): boolean`

| Option | Default | Description |
|--------|---------|-------------|
| `bubbles` | `true` | Propagate up the DOM tree |
| `composed` | `true` | Cross Shadow DOM boundaries |
| `cancelable` | `false` | Allow `preventDefault()` |

It dispatches a `CustomEvent<T>` and returns the result of `dispatchEvent` — `false` when a listener called `preventDefault()` on a cancelable event.

**Listening in templates:**

```typescript
html`<my-slider @value-change=${(e) => this.onSliderChange(e.detail.value)}></my-slider>`
```

**Important:** If you construct a `CustomEvent` by hand instead, set `composed: true` for events that need to cross Shadow DOM boundaries (which is nearly always the case when communicating between components).

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

An action is `{ type, payload }`. `createAction(type, props<P>())` returns a typed creator; the `[Category] Description` pattern is enforced at the type level.

#### Creating Reducers

A reducer is registered per **slice** (top-level state key): it receives that slice's value and returns the new slice value.

```typescript
import { onAction, createReducer } from '@melodicdev/core/state';

// Reducer for the `users` slice of AppState (state is User[])
const usersReducer = createReducer<User[]>(
  onAction(loadUsersSuccess, (state, action) => action.payload.users)
);
```

#### Creating Effects

```typescript
import { Injectable } from '@melodicdev/core/injection';
import { EffectsBase } from '@melodicdev/core/state';

@Injectable()
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

Effects are `async` and resolve to `Action | Action[] | void`. Returned actions are auto-dispatched. The store resolves each effects class through the `Injector`, so it must be bound — `@Injectable()` does that. A rejected effect is logged with the triggering action and does not stop sibling effects.

### Global Store (SignalStoreService)

```typescript
import { createState, provideRX, SignalStoreService } from '@melodicdev/core/state';

interface AppState { users: User[]; loading: boolean; }

// Define state
const appState = createState<AppState>({
  users: [],
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

// Select derived values — a read-only signal
activeUsers = this._store.select('users', (users) => users.filter(u => u.active));

// Dispatch
this._store.dispatch('users', loadUsers());
// or without key (reaches every slice that handles the action):
this._store.dispatch(loadUsers());
```

**`createState(initState)`** converts each top-level key to a `Signal` (`State<S>`).

**`provideRX(initState, reducerMap, effectsMap, debug = false)`** registers the store with DI. `reducerMap` and `effectsMap` are keyed by slice; `effectsMap` values are effects **classes**. `debug: true` logs each action with the state before and after.

#### `SignalStoreService<S>` API

| Method | Description |
|--------|-------------|
| `select(key, selectFn, cacheKey?)` | `ReadonlySignal<T>` projecting slice `key` through `selectFn` (writing to it throws) |
| `dispatch(action)` | Apply the action in **every** slice that registered a reducer for its type (batched), then run every matching effect |
| `dispatch(key, action)` | Apply every matching reducer of slice `key` in registration order, then run that slice's matching effects. Throws if `key` has no reducer config |
| `snapshot()` | The whole state, read once, untracked |
| `snapshotSlice(key)` | One slice, read once, untracked |
| `logState()` | `console.log` the current state |

**`select()` lifetime** depends on where it is called:

- **Field initializer / `onInit` / `onCreate`** — cached per component (by `cacheKey`, else by `selectFn` identity) and destroyed when the component unmounts
- **During a render** (a template expression or a getter the template reads) — render-scoped: the component re-renders when the selected value changes, and the entry is destroyed by the first render that stops using it. Inline arrow selectors are therefore safe, but each render pays a computed creation; pass a `cacheKey` (e.g. `` `perm:${perm}` ``) or hold the selector in a stable reference to get cache hits across renders
- **Outside a component** (guards, resolvers, services) — nothing is cached and nothing destroys the returned computed; it stays subscribed to the slice for as long as it is referenced. Use `snapshot()` / `snapshotSlice()` for one-off reads there

**Dispatch flow:**
1. Find the matching reducer(s) by action type
2. Call `reducer(currentSliceState, action)` → new slice state
3. `signal.set(newState)` on each affected state slice, inside one `batch()`
4. Execute matching effects
5. If an effect resolves to action(s), dispatch them (key-less)

### Component-Local State (ComponentStateBaseService)

```typescript
import { ComponentStateBaseService, createAction, createReducer, onAction } from '@melodicdev/core/state';

interface CounterState { count: number; }

const increment = createAction('[Counter] Increment');

const counterReducer = createReducer<CounterState>(
  onAction(increment, (state) => ({ ...state, count: state.count + 1 }))
);

class CounterStateService extends ComponentStateBaseService<CounterState> {
  constructor() {
    super({ count: 0 }, counterReducer);
  }

  increment() { this.dispatch(increment()); }
  getCount() { return this.select(s => s.count); }
}
```

Constructor: `super(initState, reducerConfig = { reducers: [] }, debug = false)`. The class extends `EffectsBase`, so `this.addEffect(...)` registers effects on the same service.

**Methods:**
- `select<T>(selectFn, cacheKey?)` — `ReadonlySignal<T>` computed from the whole state; same per-component caching and lifetime rules as `SignalStoreService.select()`
- `dispatch(action)` — run **every** reducer registered for the action type, in registration order, then the matching effects
- `resetState()` — reset to initial state
- `protected patchState(partial)` — shallow-merge update, for use inside the subclass
- `protected get state()` — the current state value

---

## Configuration

Source: `src/config/`

### Environment Detection

```typescript
import { environment, getEnvironment } from '@melodicdev/core/config';
// type Environment = 'dev' | 'qa' | 'prod'
```

Detection priority (from `import.meta.env`):

1. `VITE_ENV`, when it is `dev`, `qa` or `prod`
2. Vite's `MODE` — `development` → `dev`, `production` → `prod`, and a mode named `dev`/`qa`/`prod` is used directly (so `vite build --mode qa` resolves to `'qa'`)
3. `PROD` → `'prod'`
4. `'dev'` fallback (also used when there is no bundler env at all)

`environment` is resolved once at module load; `getEnvironment()` re-reads it. `resolveEnvironment(env)` applies the same rules to an env object you pass in.

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

`defineConfig` resolves immediately and returns the plain merged object (`TBase & T`). The current environment's block (`dev` / `qa` / `prod`) **deep-merges** onto `base`, and the result deep-merges onto `extends`. Nested plain objects merge per key; arrays and primitives replace.

### Registration & Access

```typescript
import { provideConfig, APP_CONFIG } from '@melodicdev/core/config';
import { inject } from '@melodicdev/core/injection';

// In bootstrap
await bootstrap({ providers: [provideConfig(appConfig)] });

// In components/services
const config = inject(APP_CONFIG) as MyConfigType;   // or Injector.get(APP_CONFIG)
```

`APP_CONFIG` is typed `unknown` (it is shared by every app), so cast to your config type at the read site.

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

Tokens are keyed by **identity** — strings by value, symbols and classes by reference. Two `createToken('x')` calls produce two distinct tokens.

### Container API (`Injector`)

| Method | Signature | Description |
|--------|-----------|-------------|
| `bind` | `(cls, options?) \| (token, cls, options?)` | Register class binding. `options`: `{ singleton?, dependencies?, args? }` |
| `bindValue` | `(token, value)` | Register value (always singleton) |
| `bindFactory` | `(token, factory, options?)` | Register factory function. `options`: `{ singleton? }` |
| `get` | `(token) → T` | Resolve (throws if not found) |
| `has` | `(token) → boolean` | Check existence |
| `getBinding` | `(token) → Binding<T> \| undefined` | Get raw binding |
| `entries` | `() → [TokenKey, Binding][]` | Every registered binding (diagnostics/DevTools) |
| `unbind` | `(token) → boolean` | Remove binding |
| `clear` | `()` | Remove all bindings |
| `addTeardown` | `(fn: () => void)` | Register cleanup for something a provider set up outside the container (window listeners, global browser state). `bootstrap()` collects the teardowns its providers registered and runs them from `app.destroy()` |

All bindings are **singletons by default**. Circular dependencies detected at runtime with descriptive error messages. Re-binding a token (`bind` / `bindValue` / `bindFactory`) whose singleton was already resolved warns in dev mode: existing holders keep the old instance. Bind before the first resolution, or `unbind()` first.

Constructor arguments for a class binding come from `@Inject` parameters when present, otherwise from `options.dependencies` (tokens, resolved in order); `options.args` (raw values) are appended after them.

### Decorators

#### `@Injectable(meta?)`

Class decorator. Registers in `Injector` at decoration time.

```typescript
@Injectable()
class MyService { }

@Injectable({ token: MY_TOKEN, singleton: true })
class MyServiceImpl { }
```

`meta`: `{ token?, singleton?, dependencies?, args? }` — `token` defaults to the class itself.

#### `@Inject(token)`

Parameter decorator for constructor injection.

```typescript
@Injectable()
class UserService {
  constructor(@Inject(HttpClient) private http: HttpClient) {}
}
```

#### `@Service(token)`

Property decorator for lazy injection on components and services. Resolves on first property access and caches the result per instance. Does **not** trigger reactivity.

```typescript
@MelodicComponent({ selector: 'my-comp', template: myTemplate })
class MyComp {
  @Service(UserService) private readonly _userService!: UserService;
}
```

The field is writable: assigning to it replaces the resolved value for that instance only, so a test can supply a fake without touching the container (`component.http = fakeHttp` for a `@Service(HttpClient) http!: HttpClient` field). The declared field type is not checked against the token — `@Service(HttpClient) http!: Logger` compiles.

### `inject()` / `injectOptional()`

```typescript
import { inject, injectOptional } from '@melodicdev/core/injection';

class MyComp {
  private readonly _http = inject(HttpClient);                 // typed by the token: HttpClient
  private readonly _analytics = injectOptional(ANALYTICS);     // Analytics | undefined
  private readonly _logger = injectOptional(LOGGER, console);  // fallback when unbound
}
```

- `inject<T>(token: Token<T>): T` — `Injector.get(token)` with the return type derived from the token. Throws if the token is not bound
- `injectOptional<T>(token, fallback?)` — returns `undefined` (or `fallback`) when the token is not bound
- Resolution is **eager**: call it where the binding already exists — a component field initializer (bootstrap has run by then), `onInit`, or a service constructor. `@Service` remains the lazy option

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

- `component` is the custom element **tag name** (a string), not a class
- `path: ''` matches root; as a child it is the parent's default child and is part of the matched chain (its guards and resolvers run)
- `path: '**'` is wildcard/not-found
- `:param` captures a single **non-empty** segment (matched via `([^/]+)` regex) — `{ path: ':id' }` does not match `/`
- `*param` captures everything (matched via `(.*)` regex)
- Param values are URL-decoded when matched and URL-encoded when a path is built
- `redirectTo` substitutes the matched route's params (`{ path: 'u/:id', redirectTo: '/users/:id' }`); a `*splat` param keeps its slashes (`/legacy/a/b` → `/docs/a/b`). A `redirectTo` without a leading `/` is resolved against the parent route's path
- A route-level redirect keeps the query string and fragment of the URL that was redirected (`/old?code=abc#top` → `/new?code=abc#top`) unless the `redirectTo` target declares its own
- `loadComponent` and `loadChildren` are awaited **inside the navigation pipeline**, before guards and resolvers, so guards on lazily loaded children are enforced. Each loader is invoked once and its promise shared; a failed load fails the navigation
- A matched route with no `component` renders nothing in its outlet (the previous view is cleared)
- `RouteMatcher` (usable standalone: `new RouteMatcher(path, rules?)` with `parse`, `parsePrefix`, `stringify`) supports optional validation rules per param: `RegExp | ((value: string) => boolean) | string`

#### Registering Routes

```typescript
import { provideRouter } from '@melodicdev/core/routing';

await bootstrap({
  providers: [provideRouter(routes, { scrollRestoration: true })]
});
```

`provideRouter(routes?, options?)` installs the history events (idempotently), constructs the shared `RouterService` and, when `routes` are supplied, registers them so navigation works before any `<router-outlet>` mounts. `options.scrollRestoration` (default `true`) lets the router remember and restore scroll positions across back/forward; pass `false` to leave the browser in charge. It also registers a teardown, so `app.destroy()` removes the router's window listeners, restores `history.scrollRestoration` and drops the instance (a later bootstrap gets a live router). Passing routes to the root outlet instead (`<router-outlet .routes=${routes}>`) remains supported.

### RouterService

`@Injectable()` singleton; inject it with `@Service(RouterService)` or `inject(RouterService)`. The full match → lazy-load → guards → resolvers → commit pipeline runs in the service for programmatic navigation, the initial load **and** browser back/forward; outlets only render the committed route.

`history.pushState`/`replaceState` are patched (once, idempotently) to dispatch a window `NavigationEvent` — when the first `RouterService` is constructed or via `provideRouter()`, not at module import.

#### Key Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setRoutes` / `getRoutes` | `(routes) → void` / `() → IRoute[]` | Root route config |
| `navigate` | `(path, options?) → Promise<INavigationResult>` | Primary navigation. Paths are root-relative: `navigate('about')` means `/about`. A same-origin absolute URL is reduced to its path; a cross-origin URL is refused and resolves `{ success: false, error }` (use `window.location` for external navigation) |
| `navigateByName` | `(name, params?, options?) → Promise<INavigationResult>` | Named route navigation (`success: false` when the name is unknown) |
| `replace` | `(path, data?) → void` | `navigate(path, { replace: true, data })` — runs the full pipeline, not awaited |
| `back` / `forward` / `go(delta)` | — | History navigation |
| `getParams` | `<Path>() → RouteParams<Path>` | All route params of the committed route |
| `getParam` | `(name) → string \| undefined` | Single param |
| `getQueryParams` | `() → URLSearchParams` | Query parameters (of the navigation target while one is in flight) |
| `getRouteData` | `(depth?) → Record<string, unknown>` | Merged static `data` |
| `getResolvedData` | `(depth?) → Record<string, unknown>` | Merged resolver output |
| `getCurrentMatches` | `() → IRouteMatch[]` | The committed match chain |
| `matchPath` | `(path) → IRouteMatchResult` | Match without side effects |
| `initialNavigation` | `() → Promise<INavigationResult>` | Run the pipeline for the current location without touching history. The root outlet calls it on startup |
| `enableScrollRestoration` | `(enabled) → void` | Turn the router's scroll restoration on/off |
| `destroy` | `() → void` | Remove the service's window listeners (tests/teardown) |

**Typed params:** pass the route path as a type argument to have param names checked.

```typescript
const { id } = router.getParams<'users/:id'>();   // { id: string }
router.getParams<'users/:id'>().userId;            // compile error
router.getParams();                                // Record<string, string>

import type { RouteParams } from '@melodicdev/core/routing';
type P = RouteParams<'users/:userId/posts/:postId'>;   // { userId: string; postId: string }
```

### Reactive Route State

`RouterService` exposes the committed route as signals. Reading one in a template re-renders the component when it changes — the supported way to react to `/users/1 → /users/2`, where the component stays mounted and `onCreate` does not run again.

| Signal | Type | Description |
|--------|------|-------------|
| `params` | `Signal<Record<string, string>>` | Route params of the committed route |
| `queryParams` | `Signal<URLSearchParams>` | Query params of the committed route |
| `resolvedData` | `Signal<Record<string, unknown>>` | Merged resolver output of the committed route |
| `events` | `Signal<INavigationEvent \| null>` | The most recent navigation lifecycle event (`null` before the first navigation) |
| `committedRoute` | `Signal<IRouteMatchResult \| null>` | The last committed match result (what outlets render) |

```typescript
@MelodicComponent({
  selector: 'user-detail',
  template: (c: UserDetail) => html`<h1>User ${c.router.params().id}</h1>`
})
class UserDetail {
  @Service(RouterService) router!: RouterService;
}
```

#### Navigation Events

```typescript
router.events.subscribe((event) => {
  if (event?.type === 'start') showProgress();
  if (event?.type === 'end' || event?.type === 'error') hideProgress();
});
```

```typescript
interface INavigationEvent {
  type: 'start' | 'redirect' | 'blocked' | 'error' | 'superseded' | 'end';
  id: number;                                   // shared by every event of one navigation
  url: string;                                  // target URL (path + query + hash)
  trigger: 'imperative' | 'popstate' | 'initial';
  result?: IRouteMatchResult;                   // on 'end'
  redirectTo?: string;                          // on 'redirect'
  error?: string;                               // on 'error' and 'blocked'
}
```

- `start` — a navigation was claimed (before deactivation guards run)
- `redirect` — handing off to another URL (route `redirectTo` or a guard returning a path)
- `blocked` — a guard returned `false`
- `error` — a resolver, a lazy load or the redirect limit failed it
- `superseded` — a newer navigation started while this one was awaiting
- `end` — the match result was committed

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
| `skipGuards` | `boolean` | `false` | Skip both activation and deactivation guards |
| `skipResolvers` | `boolean` | `false` | Skip resolver execution |
| `scrollToTop` | `boolean` | `true` | Scroll to top after nav (a `#hash` in the path scrolls to that element instead) |
| `onSameUrlNavigation` | `'ignore' \| 'reload'` | `'ignore'` | What to do when the target path + query equals the current one. `'ignore'` leaves history and resolved data untouched and only re-applies scrolling; `'reload'` re-runs the whole pipeline and pushes a new history entry |

`queryParams` are merged into any query string already in `path` and inserted before the fragment (`/docs?q=1#intro`).

#### `INavigationResult`

```typescript
interface INavigationResult {
  success: boolean;
  url?: string;        // the navigated URL on success
  error?: string;      // e.g. 'Navigation blocked by guard', 'Navigation superseded', a resolver/lazy-load failure
  redirectTo?: string;
}
```

`navigate()` resolves (it does not reject) when a navigation is blocked, fails or is superseded — check `success`. When a navigation redirects, the returned result is that of the redirect target.

#### Navigation Flow

1. Claim the navigation (emit `start`). A navigation to the current URL is ignored here unless `onSameUrlNavigation: 'reload'`
2. Run **deactivation guards** on current routes (if not skipped) — asked once per navigation, not once per redirect hop
3. Match target path against route tree, awaiting `loadChildren` / `loadComponent` for the matched chain
4. Handle a route `redirectTo` (recursive navigate that keeps the caller's push/replace intent, and the query string and fragment unless the target sets its own)
5. Run **activation guards** (if not skipped). A guard returning a path redirects — and the redirect target runs its **own** activation guards
6. Run **resolvers** (if not skipped). A failing resolver fails the navigation
7. Update current matches
8. `history.pushState` or `replaceState`
9. Publish the route state signals and the committed route (outlets render)
10. Scroll to top or hash target (hash lookup searches shadow roots), emit `end`

- A navigation that is overtaken by a newer one while awaiting a guard, resolver or lazy load bails out without committing (`superseded`)
- A blocked or failed `navigate()` commits nothing: params, matches and resolved data stay as they were
- Redirect hops (route `redirectTo` and guard redirects combined) are bounded at **10** per navigation; exceeding it fails with an error that lists the chain
- A guard redirect does not inherit the caller's `queryParams` or `data`

#### Browser Back/Forward (popstate)

On `popstate` events (browser back/forward buttons) the URL has already changed, so the same pipeline runs against the new location:
1. A hash-only change (same path and query) is not a route change: only scrolling is applied
2. Deactivation guards are run against current matches, then the new path is matched (lazy loads included), and its activation guards and resolvers run
3. If a guard blocks, the router steps history back to the entry it was on (`history.go(delta)`, using an index it stamps onto `history.state`) so the URL reverts. A guard returning a path redirects with `replace: true`
4. If allowed, the route is committed (outlets render), the scroll position saved for that history entry is restored (or the `#hash` target scrolled to), and a window `NavigationEvent` is dispatched so router links refresh their active state
5. A lazy-load or resolver failure commits an empty match, so outlets render their not-found view

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

Guards go on a route's `canActivate` / `canDeactivate` arrays and resolvers on its `resolve` map:

```typescript
const routes: IRoute[] = [
  { path: 'users/:id', component: 'user-detail', canActivate: [authGuard], canDeactivate: [unsavedChangesGuard], resolve: { user: userResolver } }
];
```

**Guard return values:** `true` (allow), `false` (block), `string` (redirect) — synchronously or as a promise. A guard that throws is logged and treated as `false`.

**Guard context:**

```typescript
interface IGuardContext {
  route: IRouteMatch;
  matchedRoutes: IRouteMatch[];
  params: Record<string, string>;
  queryParams: URLSearchParams;   // of the navigation target
  targetPath: string;             // activation: the target pathname; deactivation: the full target path
  currentPath: string;
  data?: Record<string, unknown>; // the route's static data
}
```

**Resolver context** (`IResolverContext`): `route`, `matchedRoutes`, `params`, `queryParams`, `targetPath`.

Guards run sequentially root→leaf. First block/redirect stops execution. Resolvers run depth by depth (so a child's resolvers start after its parent's finished); the resolvers of one route run in parallel (`Promise.all`). Resolver output is committed atomically, only if the navigation is still current.

Read resolver output with `router.getResolvedData()` or reactively with `router.resolvedData()` — both return the merged map keyed by the names in `resolve` (`{ user }` above).

A guard redirect runs the redirect target's own guards, so a guard cannot redirect into a protected route and open it.

### Router Components

#### `<router-outlet>`

```html
<router-outlet .routes=${routes}></router-outlet>
<!-- or, with provideRouter(routes) in bootstrap: -->
<router-outlet></router-outlet>
```

- Outlets are renderers only — they never match, guard or resolve; they render the route the service committed
- Root outlet: registers its `.routes` with the router (when given), runs `router.initialNavigation()`, and renders `matches[0]` of each committed route
- Nested outlets: auto-register with the outlet they nest inside via the `melodic:outlet-register` event and render `matches[depth]` of the committed chain. Two sibling outlets in one component are siblings, not parent and child
- **A route change under an unchanged component keeps the mounted element.** When the same component tag matches again but its params, the query string or its resolved data changed (`/users/1 → /users/2`, `/search?q=a → /search?q=b`, a reload that re-ran the resolvers), the outlet calls the component's `onRouteChange(change)` hook (if implemented) and re-renders it instead of recreating it. This applies at every depth, so a parent layout that stays mounted hears about it too
- Not found: renders the `component` of a route with path `'404'` or `'**'` in that outlet's routes — a bare root outlet (no `.routes`) looks in the routes given to `provideRouter(routes)`; with neither, the root outlet navigates to `/404`
- A nested outlet with no match at its depth clears its view, so the old child does not stay on screen when the chain gets shorter (`/settings/profile → /settings`)

```typescript
import type { IRouteChange, IRouteChangeAware } from '@melodicdev/core/routing';

class UserDetail implements IRouteChangeAware {
  onRouteChange(change: IRouteChange): void {
    // change: { params, queryParams, resolvedData, match }
    void this.load(change.params.id);
  }
}
```

#### `<router-link>`

```html
<router-link href="/about" active-class="selected">About</router-link>
```

Observed attributes: `href`, `active-class`. Props: `href`, `data`, `queryParams`, `activeClass` (`'active'`), `exactMatch` (`false`), `replace` (`false`). The inner anchor is exposed as `part="link"`.

A plain left click navigates through the router. Modifier clicks (ctrl/cmd/shift/alt) and middle clicks keep the browser's native behaviour (new tab/window). The active class is applied to the host and `aria-current="page"` to the anchor, refreshed on every navigation; without `exactMatch` a link is active for its own path and any path beneath it. URLs with a scheme other than `http`/`https` (`javascript:`, `data:`, …) are rejected: never assigned to `href`, navigated to or opened. An `http(s)` URL on **another origin** is not a route: the click is left to the browser (non-anchor hosts get `window.location.assign`). A scheme-less `href` without a leading slash is root-relative (`href="about"` → `/about`).

#### `:routerLink` Directive

```html
<a :routerLink="/home">Home</a>
<a :routerLink=${{ href: '/about', exactMatch: true }}>About</a>
```

Accepts a path string or `IRouterLinkOptions`: `{ href, activeClass?, exactMatch?, replace?, data?, queryParams? }`. It shares one implementation (`RouterLinkCore`) with `<router-link>`, so click, active-state and safe-URL behaviour are identical. On an `<a>` it also sets `href`; on other elements a modifier or middle click opens the target in a new tab.

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
  allowCrossOriginDefaults?: boolean;   // default: false
}
```

**`defaultHeaders` and `credentials` are origin-scoped.** They are applied to relative URLs and to absolute URLs on the `baseURL`'s origin or the page's own origin. A request to any other origin gets neither — a default `Authorization` header is meant for your API, not for whichever third-party URL a request names. Set `allowCrossOriginDefaults: true` to send them everywhere. Headers and `credentials` set on the request itself are always sent.

#### Request Methods

All return `Promise<IHttpResponse<T>>`.

| Method | Signature |
|--------|-----------|
| `get<T>` | `(url, config?) → Promise<IHttpResponse<T>>` (deduplicate defaults `true`) |
| `post<T>` | `(url, body?, config?)` |
| `put<T>` | `(url, body?, config?)` |
| `patch<T>` | `(url, body?, config?)` |
| `delete<T>` | `(url, config?)` |

A relative `url` is joined to `baseURL` with exactly one slash; an absolute URL (`https://…`) is used as-is.

#### `IRequestConfig`

| Option | Type | Description |
|--------|------|-------------|
| `headers` | `Record<string, string>` | Per-request headers (merged over `defaultHeaders`) |
| `params` | `Record<string, string \| number \| boolean \| null \| undefined \| Array<string \| number \| boolean>>` | URL query params. `null`/`undefined` are skipped; arrays expand to repeated keys |
| `timeout` | `number` | Abort the request after this many milliseconds (rejects with `AbortError`) |
| `signal` | `AbortSignal` | Caller-supplied abort signal; combined with `timeout` |
| `deduplicate` | `boolean` | Deduplicate identical in-flight requests |
| `responseType` | `'json' \| 'text' \| 'blob' \| 'arrayBuffer'` | Decode the response body as this type instead of inferring it from `Content-Type`. Use `'blob'` or `'arrayBuffer'` for downloads whose content type is not on the built-in binary list (spreadsheets, archives, vendor types) |
| `onProgress` | `(progress) => void` | Download progress callback (requires a `Content-Length` response header) |
| `abortController` | `AbortController` | **Deprecated** — pass `signal` (`controller.signal`) instead. Still honored |
| `credentials` | `RequestCredentials` | Credential mode (e.g., `'include'`, `'same-origin'`) |
| `mode` | `RequestMode` | Request mode (e.g., `'cors'`, `'no-cors'`) |
| `cancel` | `IRequestCancellation` | Pre-flight cancellation (set by interceptors) |

`url`, `method` and `body` are also part of `IRequestConfig`; the request methods fill them in, and interceptors can read them.

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
- Typed arrays and `DataView` (any `ArrayBuffer` view) → sent as binary, like `ArrayBuffer`
- Plain objects and arrays → `JSON.stringify()`, and `Content-Type: application/json` is added unless a `Content-Type` header is already set
- **FormData special case:** `Content-Type` header is explicitly deleted (both casing variants) to let the browser set the correct multipart boundary

#### Response Parsing

Responses are parsed automatically based on `Content-Type`:
- An explicit `responseType` wins over everything below (`'arrayBuffer'` is only ever produced this way)
- Any JSON content type — `application/json`, `text/json`, or a `+json` suffix such as `application/problem+json` and `application/vnd.api+json` → parsed JSON. An empty body (201/204) resolves to `data: null`; a body that is not valid JSON is returned as the raw text (the status is kept, so a 502 HTML page under a JSON content-type is still an `HttpError`)
- `text/*` → text
- `application/octet-stream`, `application/pdf`, `application/zip`, `image/*`, `audio/*`, `video/*`, `font/*` → `Blob`
- Anything else → text

A non-2xx status rejects with `HttpError` after the body is parsed, so the parsed body is available as `error.response.data`.

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
  async error(err) { /* called when intercept() throws; the error is then rethrown */ }
};
```

Request interceptors run in registration order before the fetch (a retried request runs them again). The `config` they receive already has the merged headers and the final `url` (base URL and query params applied).

**Cancel from interceptor:** Set `config.cancel = { cancelled: true, cancelReason: 'Not authorized' }`. No fetch is made, remaining request interceptors are skipped, and the call **resolves** with `{ data: null, status: 0, statusText: 'Request Cancelled' }` — merged with `config.cancel.cancelledResponse` when one is supplied (e.g. to serve a cached response).

#### Response Interceptor

```typescript
const loggingInterceptor: IHttpResponseInterceptor = {
  async intercept(response) {
    console.log(`${response.status} ${response.config.url}`);
    return response;
  }
};
```

Response interceptors run exactly once per response, in registration order — also for deduplicated and retried requests. The same holds for their `error` handlers: when a deduplicated request fails, the error chain runs once for the shared request, so N callers sharing one 401 trigger one token refresh and one retry, and every caller receives the same outcome. A caller that aborts its own `signal` is reported to the error handlers for that caller alone.

**Error recovery and retry:** a response interceptor may implement `error(error, context)`, called when the request fails (non-2xx, network, abort) or when an `intercept()` throws.

```typescript
const authRetry: IHttpResponseInterceptor = {
  async intercept(response) { return response; },
  async error(error, { retry, retryCount }) {
    if (error instanceof HttpError && error.response.status === 401 && retryCount === 0) {
      await refreshToken();
      return retry();          // re-issues the original request
    }
    throw error;               // or resolve void: defer to the next interceptor
  }
};
```

- Return an `IHttpResponse` to recover — the remaining response interceptors then run on it
- `context.retry()` re-issues the original request through the whole pipeline. It may be called once per failure, and a request is retried at most 3 times (`retryCount` is the number already attempted)
- Throwing from `error()` replaces the propagated error ("catch `HttpError`, throw a domain error" reaches the caller). If no handler recovers, the last error thrown is what the caller receives

### Request Deduplication

GET requests default to `deduplicate: true`; other methods opt in with `deduplicate: true`. Identical in-flight requests share one fetch and one response.

- "Identical" means the same method, URL, query params, headers (case-insensitive names, order-independent), `credentials`, `mode`, `responseType` and serialized body. Two `GET /me` calls with different `Authorization` headers never share a response
- `FormData`, `Blob`, `ArrayBuffer`, typed-array and stream bodies are never deduplicated
- Cancellation is per caller: aborting one caller's `signal` rejects that caller with `AbortError` while the shared request keeps running for the others; the underlying fetch is aborted only when every participant has aborted

### Error Handling

```typescript
import { HttpError, NetworkError, AbortError } from '@melodicdev/core/http';

try {
  await http.get('/data');
} catch (e) {
  if (e instanceof HttpError) {
    // Non-2xx response: e.response (status, data, headers), e.config, e.code ('HTTP_404', etc.)
  } else if (e instanceof NetworkError) {
    // No response at all (DNS, offline, CORS): e.code = 'NETWORK_ERROR'
  } else if (e instanceof AbortError) {
    // Aborted by a signal or a timeout: e.code = 'ABORTED'
  }
}
```

All three extend the abstract `HttpBaseError` (`message`, `config`, `code`), also exported. `AbortError.message` is `'Request timed out'` for a `timeout` and `'Request aborted'` otherwise.

---

## Forms

Source: `src/forms/`. See `docs/FORMS.md` for the full guide.

### AbstractControl

The base class for `FormControl`, `FormGroup`, and `FormArray`. Components that hold an `AbstractControl` instance as a property are automatically subscribed to its `value` and `state` signals — no manual `SignalEffect` is required. A control created inside a component (field initializer, `onInit`, `onCreate`) is destroyed with that component.

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
email.dirty();   // false (Signal) — a programmatic setValue does not dirty the control
```

`createFormControl<T>(initialValue: T, options?: ControlOptions<T>): FormControl<T>`. The control validates once on creation.

#### Reactive Properties (all Signals)

| Property | Type | Description |
|----------|------|-------------|
| `value` | `Signal<T>` | Current value (for groups/arrays: excludes disabled children) |
| `errors` | `Signal<ValidationErrors \| null>` | Current errors at this level |
| `valid` / `invalid` | `Signal<boolean>` | Validity state (cascades from children for groups/arrays). A disabled control is never `invalid`; `valid` is `false` while `pending` |
| `dirty` / `pristine` | `Signal<boolean>` | Changed state (aggregated from children) |
| `touched` / `untouched` | `Signal<boolean>` | Touched state (aggregated from children) |
| `pending` | `Signal<boolean>` | True during async validation |
| `disabled` / `enabled` | `Signal<boolean>` | Disabled state |
| `state` | `Signal<ControlState>` | Composite state object — recommended subscription point |

Plain (non-signal) members: `updateOn`, `messages`, `parent` (the owning group/array, or `null`), `destroyed`, and on `FormControl` `initialValue`.

#### Methods

| Method | Description |
|--------|-------------|
| `setValue(value, options?)` | Set value and validate. Does **not** mark the control dirty (user input through `:formControl` does); call `markAsDirty()` for that. `{ markAsPristine: true }` clears dirty (e.g., server hydration). A disabled control still accepts the write — `disabled` keeps the user out of a field, not the application |
| `patchValue(partial, options?)` | Merge into current value (object values) or replace it. Same `options` as `setValue` |
| `getRawValue()` | The value including disabled controls (identical to `value()` for a plain control) |
| `reset(value?)` | Reset to initial or provided value; clears dirty and touched; revalidates |
| `markAsTouched()` / `markAsUntouched()` | Touch state (`markAsTouched()` also validates when `updateOn` is `'blur'`) |
| `markAsDirty()` / `markAsPristine()` | Dirty state |
| `markAllAsTouched()` / `markAllAsUntouched()` | Touch self (cascades in `FormGroup` / `FormArray`) |
| `markAllAsDirty()` / `markAllAsPristine()` | Dirty self (cascades in `FormGroup` / `FormArray`) |
| `disable()` / `enable()` | Disabled state |
| `setValidators(validators)` | Replace sync validators (revalidates) |
| `setAsyncValidators(validators)` | Replace async validators (revalidates) |
| `addValidators(validators)` | Append sync validators (revalidates) |
| `removeValidators(validators)` | Remove by reference (revalidates) |
| `validate()` | Manual validation trigger; returns a promise that settles when validation (including async) finished |
| `hasError(code)` / `getError(code)` | Check/get specific error |
| `getErrorMessage(code)` / `getFirstErrorMessage()` | Resolved display message (see [Messages](#messages)); `''` when there is no such error |
| `destroy()` | Clean up signals. Called automatically for controls created inside a component |

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

#### `updateOn`

`updateOn` governs when the **view** writes to the model through `:formControl`:

| Value | The bound element's value is written to the control… |
|-------|------------------------------------------------------|
| `'change'` (default) | on every input event |
| `'blur'` | when the element loses focus |
| `'submit'` | when the enclosing `<form>` fires `submit` (the control is also marked touched and validated). The form is looked up when the directive runs and, if none is found yet, again once the rendered template is attached — so the `<form>` may live outside the template that holds the control |

With `'blur'` and `'submit'` the write (and `markAsDirty()`) happens only when the element's value actually differs from the control's, so tabbing through a field does not dirty it.

A programmatic `setValue()` always validates, whatever `updateOn` is. On a `FormGroup` / `FormArray`, `updateOn` decides when the aggregate's **own** validators re-run after a child value changes: `'change'` on every change, `'blur'` on `markAsTouched()`, `'submit'` only on an explicit `validate()`.

#### Disabled Controls

A disabled control is excluded from its parent's `value()` (use `getRawValue()` for everything) **and** from validity: it is never `invalid` itself and does not make its parent invalid or pending. A disabled `required` field therefore cannot block submit.

Programmatic writes still reach disabled controls: `setValue()` and `patchValue()` write to a disabled `FormControl`, and to the children of a disabled `FormGroup` / `FormArray`, so `form.patchValue(serverData)` fills read-only fields.

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

FormGroup uses the same `ControlOptions<T>` as FormControl, where `T` is the aggregate value object type. Group-level validators receive the entire group value object and can validate cross-field constraints (e.g., password confirmation matching). Group `valid` state requires all enabled children valid AND group-level errors null. The `controls` property is a `Signal` — adding/removing controls automatically re-aggregates state.

#### Methods

| Method | Description |
|--------|-------------|
| `get(name)` | Get child control (`AbstractControl<T[K]>`) |
| `addControl(name, control)` | Add control dynamically |
| `removeControl(name)` | Remove **and destroy** the control |
| `contains(name)` | Check existence |
| `setValue(value, options?)` | Set all children. **Strict**: throws when `value` has an unknown key or is missing a control's key — use `patchValue` for partial updates. `{ markAsPristine: true }` keeps the form pristine after hydration |
| `patchValue(partial, options?)` | Set only provided children (`undefined` entries are skipped). Same `options` as `setValue` |
| `getRawValue()` | Value including disabled children (which `value()` omits) |
| `reset(value?)` | Reset all children (to the provided per-key values, else their initial values) |
| `markAllAsTouched()` / `markAllAsUntouched()` | Touch all (cascades into nested groups/arrays) |
| `markAllAsDirty()` / `markAllAsPristine()` | Dirty all (cascades into nested groups/arrays) |
| `disable()` / `enable()` | Disable/enable group + children |
| `validate()` | Validate all children + group validators |
| `destroy()` | Destroy the group and every child control |

Bulk writes (`setValue`, `patchValue`, `reset`, `enable`, `disable`, `markAllAs*`) are batched: one aggregate `value`/`state` notification and one group validation per call. To show every error on submit, call `form.markAllAsTouched()`.

### FormArray

```typescript
import { createFormArray, createFormControl } from '@melodicdev/core/forms';

const tags = createFormArray<string>([createFormControl('a'), createFormControl('b')]);

tags.push(createFormControl('c'));
tags.value();       // ['a', 'b', 'c']
tags.at(0);         // AbstractControl<string> | undefined
tags.length;        // 3
tags.removeAt(1);   // removes and destroys the control
```

`createFormArray<T>(controls: AbstractControl<T>[], options?: ControlOptions<T[]>): FormArray<T>` — an ordered list of controls. Same aggregate signal contract as FormGroup (`controls` is a `Signal<AbstractControl<T>[]>`). Typically used for repeating control sets (e.g., a list of addresses, each a `FormGroup`).

| Method | Description |
|--------|-------------|
| `length` | Number of controls (getter) |
| `at(index)` | Control at `index`, or `undefined` |
| `push(control)` / `insert(index, control)` | Add a control |
| `removeAt(index)` / `clear()` | Remove and destroy one / all controls |
| `setValue(values, options?)` | Set every child. **Strict**: throws on a length mismatch |
| `patchValue(values, options?)` | Set children by index; `undefined` entries and extra indices are skipped |
| `getRawValue()` | Values including disabled children |
| `reset(values?)`, `markAllAs*()`, `disable()` / `enable()`, `validate()`, `destroy()` | As on `FormGroup` |

### Validators

All return `ValidationErrors | null`. `null` = valid. Errors are keyed by code and shaped `{ code: string, params?: Record<string, unknown> }` (e.g. `{ minLength: { code: 'minLength', params: { min: 8, actual: 3 } } }`) — display messages are resolved separately via the message registry.

| Validator | Signature | Error Code |
|-----------|-----------|------------|
| `Validators.required` | `(value) → errors` | `required` |
| `Validators.minLength(min)` | `(min) → ValidatorFn<string \| null \| undefined>` | `minLength` |
| `Validators.maxLength(max)` | `(max) → ValidatorFn<string \| null \| undefined>` | `maxLength` |
| `Validators.pattern(regex)` | `(regex) → ValidatorFn<string \| null \| undefined>` | `pattern` |
| `Validators.email` | `(value) → errors` | `email` |
| `Validators.min(n)` | `(n) → ValidatorFn<number \| null \| undefined>` | `min` |
| `Validators.max(n)` | `(n) → ValidatorFn<number \| null \| undefined>` | `max` |
| `Validators.range(min, max)` | `(min, max) → ValidatorFn<number \| null \| undefined>` | `range` |
| `Validators.compose(...fns)` | Merge errors from all validators | varies |
| `Validators.composeAsync(...fns)` | Parallel async, merge errors | varies |

The built-ins accept nullable input, so they type-check on `FormControl<string | null>` / `FormControl<number | null>`.

#### Validator Edge Cases

- `required` checks for `null`, `undefined`, `''`, and empty arrays
- `minLength` / `maxLength` / `pattern` / `email` return `null` for empty, `null` and `undefined` values (only validate non-empty values — combine with `required`)
- `min` / `max` / `range` return `null` for `null`/`undefined` values
- `pattern` resets the regex's `lastIndex` before each test, so a `/g` or `/y` regex gives a stable result
- Validation flow: every sync validator runs and their errors are merged; if any fail, async validators are skipped entirely. When they all pass and async validators exist, `errors` is cleared for the pending period (a stale sync error does not linger) and set again when the async pass settles
- Async validators run in parallel via `Promise.all` with stale-result protection; `pending` is `true` while they run
- An async validator that rejects records an `asyncValidator` error (`params.message`) instead of an unhandled rejection

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
  'That email is already taken'
);
```

`createValidator<T>(code, validationFn, defaultMessage?, options?)` / `createAsyncValidator<T>(…)`:

- `validationFn` returns `true` when valid; a failure produces `{ [code]: { code } }`
- `defaultMessage` (`string | (params) => string`) is attached to **that validator** — controls using it resolve the message without touching global state, so two validators can share a code and keep different wording
- `options.global: true` also writes the message into the global registry, where it applies to every control producing that code

A hand-written validator is any `(value: T) => ValidationErrors | null` (or the `Promise` form for async).

### Messages

Validators return `{ code, params? }`; display messages are resolved separately in this order:

1. Per-control `messages` option
2. Walk parent chain checking `messages` on each parent group/array
3. The default message attached to the validator that produced the error (`createValidator`)
4. Global default registered via `registerDefaultMessages` (the built-in validators' messages live here)
5. Fallback to the `code` string

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
- Resolves an adapter for the element (native input/checkbox/radio/select/textarea pre-registered; ml-* components register their own at import time). With no adapter, or a value that is not an `AbstractControl`, it warns and does nothing
- Pushes control value → element via adapter, and the control's disabled state via the adapter's `setDisabled`
- Pushes element input → control value and marks the control dirty — on the adapter's `inputEvent`, on blur, or on form submit, according to the control's [`updateOn`](#updateon). The deferred (blur/submit) write is skipped when the value did not change
- Marks touched on the adapter's `blurEvent` (`focusout` for the native adapters — it bubbles and is composed, so it works for both native and custom elements through shadow DOM)
- Toggles CSS classes: `mf-valid`, `mf-invalid`, `mf-dirty`, `mf-pristine`, `mf-touched`, `mf-pending`, `mf-disabled`
- Sets `error` attribute on host with the resolved validator message (`getFirstErrorMessage()`) when control is touched and has errors; removes it otherwise
- Sets a `data-form-control` marker attribute on the element

### `:model` Directive

Auto-registered attribute directive for two-way binding a **signal** to any adapter-backed control — the lightweight option for a single value with no validation.

```typescript
import { signal } from '@melodicdev/core/signals';
import '@melodicdev/core/forms';   // registers :model (any import from the forms entry does)

@MelodicComponent({
  selector: 'search-box',
  template: (c: SearchBox) => html`
    <input type="search" :model=${c.query} />
    <p>Searching for: ${c.query()}</p>
  `
})
class SearchBox {
  query = signal('');
}
```

- Writes the signal's value to the element and re-writes it whenever the signal changes
- Writes the element's value to the signal on the adapter's `inputEvent`
- Uses the same adapter registry as `:formControl`, so it works with native `input`/`select`/`textarea` (including checkboxes and radios) and every element that registered an adapter
- A value that is not a signal, or an element with no adapter, warns in dev mode and does nothing
- Use `:formControl` when you need validation, touched/dirty state or a form group

### Adapter System

Register custom adapters for any form-bearing element:

```typescript
import { registerAdapter } from '@melodicdev/core/forms';

registerAdapter((el) => el.tagName === 'MY-PICKER', {
  inputEvent: 'my-change',
  blurEvent: 'focusout',
  getValue: (el) => (el as MyPicker).value,
  setValue: (el, value) => { (el as MyPicker).value = value; },
  setDisabled: (el, disabled) => { (el as MyPicker).disabled = disabled; }   // optional
});
```

```typescript
type FormControlAdapter<T = unknown> = {
  readonly inputEvent: string;
  readonly blurEvent: string;
  getValue(element: Element): T;
  setValue(element: Element, value: T): void;
  setDisabled?(element: Element, disabled: boolean): void;
};
```

Predicates check in reverse registration order (latest wins). `getAdapter(element)` returns the adapter that would be used. Both `:formControl` and `:model` read and write through adapters.

---

## Testing

Source: `src/testing/`. Import from `@melodicdev/core/testing` (not re-exported from the root entry). Framework-agnostic — works with any test runner that provides a DOM. See `docs/TESTING.md`.

```typescript
import { mount, flush, query, text, unmountAll } from '@melodicdev/core/testing';

afterEach(() => unmountAll());

it('increments', async () => {
  const el = await mount<MyCounter>('my-counter', { count: 3 });

  query<HTMLButtonElement>(el, 'button')!.click();
  await flush();

  expect(text(el)).toContain('4');
  expect(el.component.count).toBe(4);   // the user's component instance
});
```

Renders are scheduled on a microtask and teardown is deferred by another one, so reading the DOM right after a property write — or asserting on cleanup right after removal — is too early. `flush()` yields a macrotask turn, which covers both.

| Function | Description |
|----------|-------------|
| `mount<C>(selector, properties?, options?)` | Creates the element, sets `options.attributes`, assigns `properties` **before** connecting (as a parent's `.prop=` bindings would), appends it and awaits the first render. Resolves to the element, typed `IMountedComponent<C>`: an `HTMLElement` with `component: C` and `unmount(): Promise<void>`. Throws if no component is registered under `selector` |
| `flush()` | `Promise<void>` — lets pending renders and deferred teardown run |
| `unmountAll()` | Removes everything `mount()` created and flushes. Call from `afterEach` |
| `query<E>(element, selector)` | `querySelector` inside the element's shadow root |
| `queryAll<E>(element, selector)` | `querySelectorAll` inside the shadow root, as an array |
| `text(element)` | The shadow root's text content, whitespace-collapsed and trimmed |
| `captureEvents<T>(target, name)` | Starts collecting `name` events; returns a function that stops listening and returns the captured `CustomEvent<T>[]` |
| `base(element)` | The element typed as `ComponentBase` (`requestRender()`, `isRendering`, …) |

`mount` options: `container` (mount into this element instead of a fresh `<div>` on `document.body`) and `attributes` (`Record<string, string>`).

`@Service` fields are writable, so a dependency can be swapped on a mounted instance without the container: `el.component.http = fakeHttp`.

---

## Dev Mode & DevTools

Source: `src/devtools/`. Import from `@melodicdev/core/devtools`.

### The Dev-Mode Switch

One switch gates every development diagnostic: template warnings, dev warnings (`computed()` in a render, native property name collisions, duplicate selectors, duplicate `repeat()` keys, re-bound singletons, `unknown-prop`, `host-write-readonly`, `host-write-control`, `attr-javascript-url`, `attr-inline-handler`, `reconnect-after-destroy`, …), the DevTools hook and bootstrap logging. Resolution order:

1. An explicit `setDevMode(true | false)` — `bootstrap({ devMode })` calls this
2. The bundler's `import.meta.env` flags (`DEV`, then `PROD`, then `MODE !== 'production'`)
3. Without a bundler env: `true` when `location.hostname` is `localhost`, `127.0.0.1`, `[::1]` or empty, otherwise `false` — so no-bundler/CDN consumers get diagnostics during local development

| Function | Description |
|----------|-------------|
| `isDevMode()` | Whether diagnostics are on |
| `setDevMode(enabled \| null)` | Force it on or off; `null` returns to detection |
| `devWarn(key, ...message)` | `console.warn('[Melodic]', …)` at most once per `key`, in dev mode only |
| `resetDevWarnings()` | Clear the once-per-key memory (tests) |

Do not hardcode `devMode: true` in an application's `bootstrap()` call — it ships every diagnostic to production. Leave it unset to follow the build.

### `window.melodic` Console API

Installed by `bootstrap()` in dev mode (`installConsoleApi()` installs it manually; it is a no-op outside dev mode).

| Call | Returns |
|------|---------|
| `melodic.components()` | Every registered component selector |
| `melodic.instances(selector?)` | Mounted component elements (searches shadow roots) |
| `melodic.inspect(element)` | `{ selector, element, properties, sources, rendering }` for a component element (e.g. `inspect($0)`), or `null`. `properties` holds the reactive data fields and their values; `sources` names the fields holding a signal |
| `melodic.bindings()` | Injector contents: `{ token, type, singleton, resolved }[]` |
| `melodic.on(type, listener)` | Subscribe to framework events; returns an unsubscribe function |
| `melodic.trace()` | Log every framework event until the returned function is called |

### DevTools Hook

In dev mode the framework emits structured events through `window.__MELODIC_DEVTOOLS_HOOK__` (`getHook()`; `null` outside dev mode). It is inert until something subscribes — emits cost a boolean check when nothing is listening. A hook installed on `window` before the framework loads (a browser extension) is used instead of the built-in one.

```typescript
import { getHook } from '@melodicdev/core/devtools';

const off = getHook()?.on('component:render', (event) => console.log(event.payload));
// event: { type, ts, payload? } — subscribe to '*' for everything
```

Event types: `component:define` / `connect` / `render` / `disconnect` / `destroy`, `signal:create` / `set` / `destroy`, `computed:recompute`, `effect:run`, `flush:start` / `flush:end`, `nav:start` / `end` / `blocked` / `error` / `redirect` / `superseded`, `store:dispatch`.

`signal()`, `computed()`, `effect()` and `SignalEffect` accept a `name` option; it appears in these events and in destroyed-signal and circular-effect error messages.

---

## Extension Points

### Custom Content Directives

```typescript
import { directive, Directive } from '@melodicdev/core/template';
```

Function-based or class-based. `render(container, previousState, name?)` must return state for next call; give the directive a `type` and its state a `__dispose()` when it owns nested content, listeners or subscriptions (see [Custom Directives](#custom-directives)).

### Custom Attribute Directives

```typescript
import { registerAttributeDirective } from '@melodicdev/core/template';
```

Always return a cleanup function if the directive adds listeners or modifies DOM.

### Form Control Adapters

```typescript
import { registerAdapter } from '@melodicdev/core/forms';
```

Teach `:formControl` and `:model` how to read and write a custom element's value (see [Adapter System](#adapter-system)).

### HTTP Interceptors

Request interceptors can modify config or cancel requests. Response interceptors can transform responses, recover from errors and retry.

### Global Styles

```html
<style melodic-styles>
  /* Adopted into every component's Shadow DOM via adoptedStyleSheets */
</style>

<link rel="stylesheet" melodic-styles href="global.css" />
```

The `applyGlobalStyles` function looks for `<style melodic-styles>` and `<link rel="stylesheet" melodic-styles>` elements in the document. It reads their CSS text, creates `CSSStyleSheet` objects, and applies them via `adoptedStyleSheets` on each component's shadow root. Stylesheets are cached at the module level — subsequent components reuse cached sheets instantly.

- A **cross-origin** `<link>` cannot be read (`cssRules` throws), so it is skipped with a dev-mode warning and the remaining sheets still load — serve global stylesheets same-origin or inline them
- `await refreshGlobalStyles()` re-reads the `melodic-styles` elements and adopts anything new into every shadow root created so far. Call it after adding a global stylesheet at runtime

### Registering Components

Components self-register via `@MelodicComponent`. Importing the file is sufficient — no separate "global registration" API needed. `getComponentDefinitions()` lists every registration.

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
- Give every reactive field an initializer, and do not name a field after a native `HTMLElement` property (`hidden`, `title`, `id`, …)
- Clean up in `onDestroy()` — manual subscriptions, listeners, timers. `computed()`, `effect()`, form controls and `store.select()` created inside the component are released automatically
- Put repeatable setup in `onConnect()` / `onDisconnect()`; `onCreate()` runs once
- Emit events with `emit()` so they bubble and cross shadow boundaries
- Do **not** query `shadowRoot` in `onInit()` (DOM not yet attached)
- Avoid unnecessary DOM churn; cache computed values when inputs are stable
- Surface actionable errors with context

### Performance

- `_`-prefixed properties bypass reactivity — use for internal state that shouldn't trigger renders
- Signals provide fine-grained reactivity — prefer over plain properties for shared/computed state
- `queueMicrotask` batches multiple property changes into a single render
- A template re-renders on every signal it reads — wrap a frequently changing read you do not want to drive renders in `untracked()`
- Model derived state with `computed()` in a field initializer, not with a method re-run on every render and not with a `computed()` created in the template
- Use `batch()` for several signal writes that belong together
- Interpolated arrays are reused by index — `repeat()` with stable keys is what tracks items across reordering (and minimizes mutations via the LIS algorithm)
- Outside a component, read the store with `snapshot()` / `snapshotSlice()` rather than `select()`

### Anti-Patterns

- Don't extend `HTMLElement` directly — use `@MelodicComponent`
- Don't use `any` — use proper types
- Don't query DOM in `onInit()` — use `onCreate()` or `onRender()`
- Don't mutate objects/arrays in place and expect re-renders — create new references
- Don't forget cleanup in `onDestroy()`
- Don't write a reactive property or a signal the template reads from `onRender()` or from the template itself — it schedules the render that writes it again (the render-loop guard stops it after 25 renders)
- Don't call `.set()` / `.update()` on a `computed()` or a `select()` result — both throw
- Don't hold a component-owned signal (a `computed`, a form control, a `select()`) on a long-lived service — it is destroyed with the component and throws when read afterwards
- Don't hardcode `devMode: true` in `bootstrap()`

---

## Public API Surface

### Import Paths

| Path | Contents |
|------|----------|
| `@melodicdev/core` | Re-exports every sub-module below except `testing`, plus `isDevMode`, `setDevMode`, `devWarn`, `resetDevWarnings` and `installConsoleApi` from `devtools` |
| `@melodicdev/core/bootstrap` | `bootstrap`, `IAppConfig`, `IMelodicApp`, `Provider` |
| `@melodicdev/core/components` | `MelodicComponent`, `ComponentBase`, `emit`, `applyGlobalStyles`, `refreshGlobalStyles`, `getComponentDefinitions`, `getComponentDefinition`, `attributeNames`, `attributeTypes`, `getActiveComponent`, `setActiveComponent`; types `ComponentMeta`, `TypedComponentMeta`, `ComponentAttributes`, `AttributeType`, `IEmitOptions`, `IElementRef`, lifecycle interfaces (`ILifeCycleHooks`, `OnInit`, `OnCreate`, `OnConnect`, `OnDisconnect`, `OnRender`, `OnDestroy`, `OnAttributeChange`, `OnPropertyChange`) |
| `@melodicdev/core/config` | `defineConfig`, `provideConfig`, `APP_CONFIG`, `environment`, `getEnvironment`, `resolveEnvironment`; types `Environment`, `ConfigDefinition` |
| `@melodicdev/core/signals` | `signal`, `computed`, `effect`, `untracked`, `batch`, `isSignal`, `SignalEffect`, `getActiveEffect`, `setActiveEffect`, `SIGNAL_MARKER`; types `Signal`, `ReadonlySignal`, `IEffectRef`, `IEffectOptions`, `EffectCleanup`, `ISignalOptions`, `IComputedOptions`, `Subscriber`, `Unsubscriber` |
| `@melodicdev/core/injection` | `Injectable`, `Inject`, `Service`, `inject`, `injectOptional`, `createToken`, `Injector`, `InjectionEngine`, `Binding`, `getTokenKey`, `describeToken`; types `Token`, `IInjectionToken`, `IInjectableMeta`, `IClassBindingOptions`, `IFactoryBindingOptions` |
| `@melodicdev/core/template` | `html`, `css`, `render`, `repeat`, `repeatRaw` (deprecated), `when`, `classMap`, `styleMap`, `unsafeHTML`, `live`, `portalDirective`, `directive`, `Directive`, `isDirective`, `registerAttributeDirective`, `getAttributeDirective`, `hasAttributeDirective`, `unregisterAttributeDirective`, `getRegisteredDirectives`, `TemplateResult`, `disposePart`, `disposeParts`, `disposeContainerParts`, `disposeDirectiveState` |
| `@melodicdev/core/routing` | `provideRouter`, `RouterService`, `RouterOutletComponent`, `RouterLinkComponent`, `routerLinkDirective`, `createGuard`, `createDeactivateGuard`, `createResolver`, `findRouteByName`, `buildPathFromRoute`, `matchRouteTree`, `RouteMatcher`, `RouterLinkCore`, `installHistoryEvents`, `parseUrlParts`, `appendQueryParams`, `isSafeUrl`, `RouteContextService`; types `IRoute`, `RouteParams`, `INavigationOptions`, `INavigationResult`, `INavigationEvent`, `IGuardContext`, `IResolverContext`, `IRouteGuard`, `IRouteResolver`, `IRouteMatch`, `IRouteMatchResult`, `IRouteChange`, `IRouteChangeAware`, `IRouterOptions`, `IRouterLinkOptions` |
| `@melodicdev/core/http` | `HttpClient`, `provideHttp`, `HttpError`, `NetworkError`, `AbortError`, `HttpBaseError`; types `IHttpClientConfig`, `IRequestConfig`, `IHttpResponse`, `IHttpRequestInterceptor`, `IHttpResponseInterceptor`, `IHttpResponseErrorContext`, `IRequestCancellation`, `IProgressEvent`, `HttpMethod`, `HttpRequestBody`, `HttpResponseType` |
| `@melodicdev/core/forms` | `AbstractControl`, `FormControl`, `FormGroup`, `FormArray`, `createFormControl`, `createFormGroup`, `createFormArray`, `Validators`, `createValidator`, `createAsyncValidator`, `registerAdapter`, `getAdapter`, `textAdapter`, `checkboxAdapter`, `radioAdapter`, `registerDefaultMessages`, `setDefaultMessage`, `getGlobalMessage`, `resolveMessage`, `formControlDirective`, `modelDirective`; types `ControlOptions`, `ControlState`, `SetValueOptions`, `UpdateOn`, `ValidatorFn`, `AsyncValidatorFn`, `ValidationErrors`, `ValidationError`, `MessageMap`, `FormControlAdapter`, `ICreateValidatorOptions` |
| `@melodicdev/core/state` | `createState`, `createAction`, `props`, `createReducer`, `onAction`, `provideRX`, `SignalStoreService`, `ComponentStateBaseService`, `EffectsBase`; types `State`, `Action`, `TypedAction`, `ActionReducerMap`, `ActionEffectsMap` |
| `@melodicdev/core/testing` | `mount`, `flush`, `unmountAll`, `query`, `queryAll`, `text`, `captureEvents`, `base`; types `IMountedComponent`, `IMountOptions` |
| `@melodicdev/core/devtools` | `isDevMode`, `setDevMode`, `devWarn`, `resetDevWarnings`, `getHook`, `emitDevtools`, `devtoolsListening`, `resetHook`, `installConsoleApi`, `createConsoleApi`; types `IMelodicDevtoolsHook`, `IHookEvent`, `HookEventType`, `IMelodicConsoleApi`, `IComponentInspection` |
| `@melodicdev/core/interfaces` | `INewable<T>` |

The package's `exports` map also exposes `./package.json`.

Deprecated but still exported and working: `repeatRaw` (prefer `repeat`); `RouteContextEvent`, `ROUTE_CONTEXT_EVENT` and the `IRouteContextChangeEvent` type from routing (the router never dispatches that event — read `RouterService.committedRoute()` / `params()` instead); and the `ITemplatePart.renderedContainers` field (nothing in the framework assigns it any more; it is still honoured on disposal).

`docs/API_SURFACE.md` groups every export as application API, extension API (tooling: `SignalEffect`, `RouteMatcher`, `RouterLinkCore`, the dispose functions, the active-scope accessors, DevTools) or internal (`SIGNAL_MARKER`, `TemplateResult`, `RouteContextService`, `InjectionEngine`, `Binding`, `getTokenKey`, `describeToken`, the `RX_*` tokens). Build applications on the application API.
