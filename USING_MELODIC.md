# Using Melodic

The reference for projects that **build on** Melodic. It says which API to reach for, the
one right way to write each common thing, and the mistakes that cost the most time. It is
written for developers and for AI coding agents working in a consuming project.

Written against `@melodicdev/core` 4.1.0, `@melodicdev/components` 4.1.0 and
`@melodicdev/cli` 4.1.0.

**How to reference this file from another project.** Point your project's agent
instructions (`CLAUDE.md`, `AGENTS.md`, or equivalent) at it:

```markdown
This project is built with Melodic. Before writing or changing any component, template,
route, form, service or store code, read USING_MELODIC.md from the Melodic repository
(https://github.com/MelodicDevelopment/melodic/blob/main/USING_MELODIC.md) and follow it.
```

If the Melodic repository is checked out next to your project, reference the local path
instead (`../melodic/USING_MELODIC.md`) so the guidance matches the source you build
against.

This file is selective, not exhaustive. When you need every option of an API, go to the
[reference map](#18-where-the-full-reference-lives) at the end.

---

## Contents

1. [The rules that matter most](#1-the-rules-that-matter-most)
2. [Packages and project setup](#2-packages-and-project-setup)
3. [Project layout and file conventions](#3-project-layout-and-file-conventions)
4. [Bootstrap](#4-bootstrap)
5. [Components](#5-components)
6. [Templates](#6-templates)
7. [Signals and reactivity](#7-signals-and-reactivity)
8. [Dependency injection](#8-dependency-injection)
9. [Routing](#9-routing)
10. [Forms](#10-forms)
11. [HTTP](#11-http)
12. [State](#12-state)
13. [Configuration](#13-configuration)
14. [The UI component library](#14-the-ui-component-library)
15. [Theming and styling](#15-theming-and-styling)
16. [Testing](#16-testing)
17. [Mistakes to avoid](#17-mistakes-to-avoid)
18. [Where the full reference lives](#18-where-the-full-reference-lives)

---

## 1. The rules that matter most

If you read nothing else, read these.

1. **A component is a plain class with `@MelodicComponent`.** Do not extend `HTMLElement`
   and do not call `customElements.define` yourself.
2. **Anything the template reads re-renders the component when it changes**: a public
   field that is assigned a new value, an observed attribute, and every signal read while
   the template runs, wherever that signal lives.
3. **Assign, do not mutate.** `this.items = [...this.items, item]` re-renders;
   `this.items.push(item)` does not, because nothing was assigned.
4. **Prefix non-reactive fields with `_`.** Caches, timers, DOM references and injected
   services that the template does not read belong in `_private` fields.
5. **Never name a field after a native `HTMLElement` property** (`hidden`, `title`, `id`,
   `slot`, `dir`, `tabIndex`, …). It is not mirrored onto the element. Use `isHidden`,
   `cardTitle`.
6. **Create `computed()` in a field initializer or `onInit`, never inside the template.**
7. **Register everything application-wide through `bootstrap({ providers: [...] })`**:
   `provideRouter`, `provideHttp`, `provideRX`, `provideConfig`.
8. **Use `repeat()` with a stable key for any list that reorders, filters or has items
   inserted in the middle.** Plain `.map()` is fine for append-only or static lists.
9. **Dispatch component events with `emit()`**, which sets `bubbles` and `composed` so the
   event crosses the shadow boundary.
10. **Style `ml-*` components through their CSS custom properties.** Their internals are
    in shadow DOM and outside selectors cannot reach them.

---

## 2. Packages and project setup

| Package | What it is |
|---|---|
| `@melodicdev/core` | The framework: components, templates, signals, routing, forms, HTTP, DI, state, config, testing |
| `@melodicdev/components` | The `ml-*` UI component library and theme system. Peer-depends on `@melodicdev/core` `^4.0.0` |
| `@melodicdev/cli` | `melodic` scaffolding and code generation |

**Start a new project with the CLI.** It produces the tsconfig, Vite config and file
layout this guide assumes.

```bash
npm install -g @melodicdev/cli
melodic init my-app                                  # single app
melodic init my-repo --monorepo --app-name web       # npm-workspaces monorepo
```

**Adding Melodic to an existing project** needs two compiler options. Skipping either
fails in ways that are hard to trace:

```jsonc
// tsconfig.json
{
	"compilerOptions": {
		"target": "ES2022",
		"module": "ESNext",
		"moduleResolution": "Bundler",
		"experimentalDecorators": true,      // required
		"useDefineForClassFields": false,    // required
		"strict": true
	}
}
```

- Without `experimentalDecorators`, `@Inject(...)` on a constructor parameter does not
  compile and `@Service(...)` throws at class-definition time.
- Without `useDefineForClassFields: false`, a `@Service(Token) private _svc!: Svc` field
  shadows the injected getter and **silently reads `undefined`**.

Vite, esbuild and Vitest read both from `tsconfig.json`. SWC and Babel need their own
equivalents; the repository `README.md` lists them. The packages are published as ES
modules for bundlers, not for Node's native ESM loader.

Set `build.target: 'es2022'` in `vite.config.ts` so the top-level `await bootstrap(...)`
in `main.ts` works in production builds.

**Import from sub-paths.** Every module has its own entry point; the root re-exports all
of them. Either works, and a project should pick one style and keep it.

```typescript
import { MelodicComponent, emit } from '@melodicdev/core/components';
import { html, css, repeat, when, classMap, styleMap, live } from '@melodicdev/core/template';
import { signal, computed, effect, untracked, batch } from '@melodicdev/core/signals';
import { Injectable, Service, inject, createToken } from '@melodicdev/core/injection';
import { bootstrap } from '@melodicdev/core/bootstrap';
import { provideRouter, RouterService, createGuard, createResolver } from '@melodicdev/core/routing';
import { createFormGroup, createFormControl, Validators } from '@melodicdev/core/forms';
import { provideHttp, HttpClient, HttpError } from '@melodicdev/core/http';
import { provideRX, SignalStoreService, createAction, createReducer } from '@melodicdev/core/state';
import { defineConfig, provideConfig, APP_CONFIG } from '@melodicdev/core/config';
import { mount, flush, query, text } from '@melodicdev/core/testing';
```

Use `import type` for type-only imports when `verbatimModuleSyntax` is on.

**Without a build step**, the CDN bundles give you the framework utilities and the
pre-built `ml-*` components, but authoring your own `@MelodicComponent` classes needs
TypeScript and a bundler.

---

## 3. Project layout and file conventions

```
src/
├── main.ts                    # imports the root component, calls bootstrap()
├── config/app.config.ts       # defineConfig(...)
├── components/
│   └── user-card/
│       ├── index.ts                  # barrel export
│       ├── user-card.component.ts    # the class and @MelodicComponent
│       ├── user-card.template.ts     # template function
│       └── user-card.styles.ts       # css tagged template
├── services/                  # @Injectable classes
├── guards/  resolvers/        # createGuard / createResolver
├── http/interceptors/
├── state/                     # actions, reducers, effects
└── styles/global.css          # linked with <link melodic-styles>
```

Generate files rather than writing them by hand, so names and structure stay consistent:

```bash
melodic generate component user-card      # also: service, directive, attribute-directive,
melodic generate guard auth               #       interceptor, guard, resolver, class
melodic generate component card --dry-run # prints what would be written
```

Names are kebab-cased and must then match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`: runs of hyphens,
underscores and spaces collapse to one hyphen, a leading or trailing hyphen is rejected,
and `generate directive` refuses JavaScript reserved words. `--dry-run` and `--force` apply to
`generate` only. A single-word component name is
prefixed automatically (`card` becomes `app-card`), because a custom element selector must
contain a hyphen.

A component must be **imported somewhere** for its element to exist. Importing the module
registers the selector; an element used in a template whose module was never imported
renders as an inert unknown element with no error.

---

## 4. Bootstrap

```typescript
// main.ts
import './components/app-root/app-root.component';
import { bootstrap } from '@melodicdev/core/bootstrap';
import { provideConfig } from '@melodicdev/core/config';
import { provideHttp } from '@melodicdev/core/http';
import { provideRouter } from '@melodicdev/core/routing';
import { appConfig } from './config/app.config';
import { routes } from './routes';

await bootstrap({
	target: '#app',
	rootComponent: 'app-root',
	providers: [
		provideConfig(appConfig),
		provideHttp({ baseURL: appConfig.apiBaseURL }, { request: [authInterceptor], response: [errorInterceptor] }),
		provideRouter(routes)
	],
	onError: (error, context) => reportError(error, context)
});
```

Order of events: `onBefore()`, then providers in order, then the root component is
mounted, then `onReady()`. If any step throws, everything done so far is rolled back.

**Leave `devMode` unset.** It follows the build (`import.meta.env.DEV`), which is what you
want. Setting `devMode: true` in a production build ships every diagnostic to users. In dev
mode `window.melodic` is installed for inspection: `melodic.components()`,
`melodic.inspect($0)`, `melodic.bindings()`, `melodic.trace()`.

A custom provider is a function that receives the injector:

```typescript
const provideFlags = (flags: Flags) => (injector: typeof Injector) => {
	injector.bindValue(FLAGS, flags);
	injector.addTeardown(() => { /* runs on app.destroy() */ });
};
```

`bootstrap()` resolves to the app instance. `app.destroy()` removes the root element and
the global error handlers, then runs every provider teardown (the router releases its
window listeners this way).

---

## 5. Components

### The standard shape

```typescript
// user-card.component.ts
import { MelodicComponent, emit } from '@melodicdev/core/components';
import { Service } from '@melodicdev/core/injection';
import { computed, signal } from '@melodicdev/core/signals';
import { userCardTemplate } from './user-card.template';
import { userCardStyles } from './user-card.styles';
import { UserService } from '../../services/user.service';

@MelodicComponent({
	selector: 'user-card',
	template: userCardTemplate,
	styles: userCardStyles,
	attributes: { 'user-id': 'string', compact: 'boolean' }
})
export class UserCardComponent {
	elementRef!: HTMLElement;                     // the host element, set by the framework

	@Service(UserService) private _users!: UserService;

	userId = '';                                  // synced from the user-id attribute
	compact = false;                              // synced from the compact attribute
	expanded = signal(false);                     // local state
	initials = computed(() => this._users.current()?.name.slice(0, 2) ?? '');

	private _timer?: number;                      // `_` prefix: not reactive

	onCreate(): void {
		void this._users.load(this.userId);
	}

	toggle = (): void => {
		this.expanded.update((open) => !open);
		emit(this.elementRef, 'user-card:toggle', { open: this.expanded() });
	};
}
```

```typescript
// user-card.template.ts
import { html, when } from '@melodicdev/core/template';
import type { UserCardComponent } from './user-card.component';

export const userCardTemplate = (self: UserCardComponent) => html`
	<article class="card">
		<span class="avatar">${self.initials()}</span>
		<button @click=${self.toggle}>Details</button>
		${when(self.expanded(), () => html`<slot></slot>`)}
	</article>
`;
```

```typescript
// user-card.styles.ts
import { css } from '@melodicdev/core/template';

export const userCardStyles = () => css`
	:host { display: block; }
	.card { padding: var(--ml-space-4); }
`;
```

Write event handlers as **arrow-function fields** (`toggle = () => {...}`) so `this` is
bound when the template passes them as `@click=${self.toggle}`.

### What makes a component re-render

| Source | Notes |
|---|---|
| A public field assigned a different value | Fields starting with `_`, functions and `elementRef` are not observed |
| An observed attribute changing | The value is coerced onto the camelCase property |
| Any signal read while the template ran | Including signals on injected services, nested in objects, or computed elsewhere |
| A field holding a `Signal` or a form control | Subscribed directly |

Renders are batched into one microtask, so several writes in a row produce one render. A
component that renders 25 times in one macrotask is stopped and reported as a render loop;
the cause is almost always a property written from `onRender`.

If the template reads something outside the reactive graph (a value on a third-party
object, say), call `requestRender()` on the element after changing it. `elementRef` is
typed `HTMLElement`, so cast it: `(this.elementRef as unknown as ComponentBase).requestRender()`.

### Choosing between a plain field and a signal

- **Plain field** for inputs set by a parent (`.user=${user}`) and attribute-backed
  values. A parent's property binding assigns the field, which re-renders.
  **Give every input field an initializer** (`user: User | undefined = undefined`). A
  field declared with no initializer (`user?: User`) does not exist until something
  assigns it, so the framework cannot observe it and the binding does nothing; dev mode
  reports this as `unknown-prop`. A field listed in `attributes` is exempt.
- A parent may also bind a plain value to a field that holds a **signal**
  (`.count=${5}` onto `count = signal(0)`): the value is written with `.set()`, and the
  signal itself is kept. Binding a plain value onto a field that holds a form control is
  ignored with a dev warning; bind a control instead.
- **`signal()`** for local state you update over time, and for anything derived state
  depends on, because `computed()` only tracks signals.
- **`computed()`** for derived values. It is cached until a source changes; a method that
  filters a list recomputes on every read.

### Attributes

Declare observed attributes with their types. The map form is the one to use:

```typescript
attributes: { open: 'boolean', offset: 'number', label: 'string' }
```

- Attribute names are lowercase kebab-case; the property is the camelCase form
  (`user-id` → `userId`).
- Boolean: present (with any value except the literal `"false"`) is `true`, absent is
  `false`. Number: numeric strings are parsed. String: never coerced.
- The list form (`attributes: ['open']`) still works and infers the type from the field's
  initial value, which is unreliable for optional fields with no initializer.

Attributes carry strings. Pass objects, arrays and functions with a property binding
(`.items=${items}`) instead.

### Lifecycle hooks

All optional. Define the method and it is called.

| Hook | When | Use it for |
|---|---|---|
| `onInit()` | After property observation is set up, before the element is in the DOM | Setting up derived state |
| `onCreate()` | Once, the first time the element connects | Initial data loads, one-time setup |
| `onConnect()` | Every connect, including the first | Work that must repeat if the element is moved |
| `onRender()` | After every render | Reading layout, driving third-party widgets. Do not write reactive fields here |
| `onDisconnect()` | Every disconnect | The pair of `onConnect` |
| `onDestroy()` | Permanent removal only | Final cleanup |
| `onPropertyChange(name, old, new)` | A reactive property is changing | Reacting to an input changing |
| `onAttributeChange(name, old, new)` | An observed attribute changed | |
| `onRouteChange(change)` | A routed component's params, query string or resolved data changed while it stayed mounted | Refetching for the new params |

Moving an element in the DOM disconnects and reconnects it without destroying it:
teardown is deferred by a microtask and a reconnect cancels it. So `onDestroy` means
"gone for good", and `onCreate` runs once.

**Hooks are not signal-tracked.** A signal read in `onCreate` does not cause anything to
re-run. To react to a signal outside the template, use `effect()`.

### Cleanup

Most things clean up after themselves when created inside a component (in a field
initializer, `onInit`, `onCreate` or during render): `effect()`, form controls, and
`store.select()` results are all destroyed with the component. You only write `onDestroy`
for resources the framework cannot see: timers, raw DOM listeners on `window`, third-party
instances.

### Events out, properties in

```typescript
// child: tell the parent something happened
emit(this.elementRef, 'user-card:select', { id: this.userId });
// pass { cancelable: true } as a 4th argument to allow preventDefault();
// emit() then returns false when a listener cancelled it

// parent template: data down by property, events up by listener
html`<user-card .user=${self.user} @user-card:select=${self.onSelect}></user-card>`;
```

Namespace event names (`thing:verb`) so they cannot collide with native events.

### Calling a component from outside

Data properties are mirrored onto the host element, so `el.user = user` and
`.user=${user}` both work. **Methods declared on the class are not.** Reach them through
the element's `component` property: `el.component.refresh()`, which always works. (A
method written as an arrow-function field is a field, so it is mirrored; do not rely on
which style a component happens to use.) Prefer a property or an event over a method call
where either would do.

### Slots

Content projection is native Shadow DOM: `<slot>` and `<slot name="footer">` in the
template, `slot="footer"` on the projected child, `::slotted(selector)` to style top-level
projected elements.

---

## 6. Templates

### Bindings

| Syntax | Does | Example |
|---|---|---|
| `${value}` | Text or nested template. `null`/`undefined` render nothing | `<p>${self.name}</p>` |
| `attr=${value}` | Sets the attribute as a string. `null`/`undefined`/`false` removes it; `true` sets it empty | `<a href=${self.url}>` |
| `?attr=${bool}` | Adds or removes a boolean attribute | `<button ?disabled=${self.busy}>` |
| `.prop=${value}` | Sets a DOM property. Any JavaScript value | `<user-list .users=${self.users}>` |
| `@event=${handler}` | Adds an event listener | `<button @click=${self.save}>` |
| `:directive=${value}` | Runs a registered attribute directive | `<a :routerLink="/home">` |

Rules that prevent the usual bugs:

- **Boolean attributes use `?` unless the value is a real boolean.** `disabled=${false}`
  removes the attribute and `disabled=${true}` sets it, so a plain binding works for
  `true`/`false`. Use `?disabled=` when the value is merely truthy or falsy (`0`, `''`, an
  object): a plain binding would write those as text. On `aria-*` a boolean is written as
  the string `"true"` / `"false"`.
- **Bindings on one element commit in the order written.** Put a dependent binding last:
  `min` and `max` before `.value` on a range input.
- **Objects, arrays and functions use `.`.** An attribute binding would stringify them.
- **Editable inputs use `live()`** (or `:model`, below): `<input .value=${live(self.text)}>`.
  A plain `.value=` binding skips the write when the bound value has not changed, so
  resetting a field to the value it already had leaves the user's typing on screen.
- A binding cannot go in tag-name position, inside an HTML comment, or inside
  `<textarea>`/`<title>` content. Dev mode reports each of these.

### Conditionals and lists

```typescript
html`
	${when(self.loading(), () => html`<ml-spinner></ml-spinner>`, () => html`<user-list></user-list>`)}

	${self.error ? html`<p class="error">${self.error}</p>` : ''}

	<ul>
		${repeat(self.users(), (user) => user.id, (user) => html`<li>${user.name}</li>`)}
	</ul>
`;
```

- `when(condition, thenFn, elseFn?)` and a ternary both work. Pass **functions** to
  `when` so the unused branch is not built.
- `repeat(items, keyFn, templateFn)` keeps each DOM node attached to its item. The key
  must be unique and stable (a database id, never the index).
- A plain `${items.map(...)}` reuses nodes **by index**. That is correct for static or
  append-only lists. For a list that is sorted, filtered or spliced, per-node state (focus,
  an open menu, a typed value) ends up on the wrong row; use `repeat()`.

### Other directives

```typescript
html`
	<div class="card ${classMap({ active: self.active, compact: self.compact })}"></div>
	<div style=${styleMap({ maxHeight: `${self.height}px`, opacity: 0.8 })}></div>
	<div>${unsafeHTML(self.trustedMarkup)}</div>
	<input :model=${self.query} />
	<div :portal="body">…</div>
`;
```

- `styleMap` never adds units. `{ maxHeight: 400 }` is invalid CSS and is dropped
  silently; write `` `${n}px` ``.
- `unsafeHTML` is for markup you trust. Never pass user input through it.
- Custom attribute directives are registered with `registerAttributeDirective(name, fn)`
  and return a cleanup function. See `docs/ATTRIBUTE_DIRECTIVES.md`.

### Global styles inside shadow roots

Every component renders into a shadow root, so page stylesheets do not reach inside. To
share base styles with all your components, mark the stylesheet:

```html
<link rel="stylesheet" href="/src/styles/global.css" melodic-styles />
```

Melodic adopts every `melodic-styles` sheet into each component's shadow root. The tag
must be in the initial HTML and the file must be same-origin.

---

## 7. Signals and reactivity

```typescript
const count = signal(0);
count();                       // read
count.set(5);                  // write
count.update((n) => n + 1);    // write from the previous value

const doubled = computed(() => count() * 2);   // lazy, cached, read-only

const stop = effect(() => {
	document.title = `${count()} items`;       // runs now, and again when count changes
	return () => { /* cleanup before each re-run and on destroy */ };
});

batch(() => { first.set('Grace'); last.set('Hopper'); });  // dependents update once

effect(() => search(query(), untracked(() => page())));    // re-runs on query, not on page
```

- `computed()` is read-only: `.set()` and `.update()` throw. If you need to write it, it
  should be a `signal()`.
- `effect()` created inside a component is destroyed with that component. Created
  anywhere else, the caller owns it and must call `.destroy()`.
- Signal writes are synchronous. Component renders are not; they happen on the next
  microtask.
- An effect that keeps writing a signal it reads is stopped after 100 runs with a
  "Circular dependency" error.
- A destroyed signal throws when read. Do not hold references to signals owned by a
  component or form that has been removed.

**Sharing state between components:** put signals on an `@Injectable` service. Any
component whose template reads `service.someSignal()` re-renders when it changes. This is
the simplest shared-state pattern and is enough for most apps; reach for the store
(section 12) when you want actions, reducers and effects.

```typescript
@Injectable()
export class CartService {
	readonly items = signal<CartItem[]>([]);
	readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

	add(item: CartItem): void {
		this.items.update((items) => [...items, item]);
	}
}
```

---

## 8. Dependency injection

```typescript
@Injectable()
export class UserService {
	constructor(@Inject(HttpClient) private _http: HttpClient) {}
}

export class UserListComponent {
	@Service(UserService) private _users!: UserService;   // lazy, resolved on first access
	private _http = inject(HttpClient);                   // eager, typed from the token
	private _analytics = injectOptional(ANALYTICS);       // undefined when not bound
}
```

- `@Injectable()` services are singletons by default.
- `@Service(Token)` on a field is the standard way to inject into a component. It is lazy,
  so it works even in field initializers that run before the binding is used.
- `inject(Token)` infers the type from the token and resolves immediately. Call it only
  where the binding already exists: a component field initializer, `onInit`, or a service
  constructor.
- For values that are not classes, make a token: `const API_URL = createToken<string>('API_URL')`,
  bind it in a provider with `injector.bindValue(API_URL, '...')`, and inject it with
  `@Inject(API_URL)` or `inject(API_URL)`. Tokens are matched by identity, so export one
  token and import it everywhere.
- Register bindings in a `bootstrap` provider, not at module top level.

---

## 9. Routing

```typescript
// routes.ts
import type { IRoute } from '@melodicdev/core/routing';

export const routes: IRoute[] = [
	{ path: '', redirectTo: '/home' },
	{ path: 'home', component: 'home-page', name: 'home' },
	{ path: 'users/:id', component: 'user-detail', name: 'user.detail', resolve: { user: userResolver } },
	{
		path: 'admin',
		component: 'admin-layout',
		canActivate: [authGuard],
		loadChildren: () => import('./admin/admin.routes').then((m) => ({ routes: m.routes }))
	},
	{ path: 'settings', component: 'settings-page', loadComponent: () => import('./pages/settings-page.component') },
	{ path: '**', component: 'not-found-page' }
];
```

- `path` has no leading slash; `redirectTo` has one.
- `component` is the custom element **tag name**, a string. The component's module must be
  imported (eagerly, or through `loadComponent`).
- Register with `provideRouter(routes)` in bootstrap and put `<router-outlet></router-outlet>`
  in the root template. A component rendered by a route with `children` contains its own
  `<router-outlet>` for them.

**Links.** Use `:routerLink` on a real anchor so the link has an `href` and supports
open-in-new-tab:

```typescript
html`
	<a :routerLink="/home">Home</a>
	<a :routerLink=${{ href: '/users', exactMatch: true, activeClass: 'current' }}>Users</a>
`;
```

**Navigating in code.** `navigate` returns a promise of `{ success, url?, error? }` (after a
redirect, the result is the redirect target's);
it does not throw when a guard blocks.

```typescript
@Service(RouterService) private _router!: RouterService;

await this._router.navigate('/users/42', { queryParams: { tab: 'orders' } });
await this._router.navigateByName('user.detail', { id: '42' });
```

**Guards and resolvers.** A guard returns `true` to allow, `false` to block, or a path
string to redirect. A guard that throws blocks the navigation.

```typescript
export const authGuard = createGuard(({ targetPath }) =>
	inject(AuthService).isSignedIn() ? true : `/login?next=${encodeURIComponent(targetPath)}`
);

export const userResolver = createResolver(({ params }) => inject(UserService).get(params.id));
```

Guards and resolvers run once per navigation, for programmatic navigation, the initial
load and back/forward alike. A redirect target's own guards always run. Guards are a
user-experience feature: lazy chunks are public files, so enforce authorization on the
server.

**Reading route state.** `params`, `queryParams`, `resolvedData` and `events` on
`RouterService` are signals. Read them in the template and the component re-renders when
they change:

```typescript
template: (self) => html`<h1>User ${self.router.params().id}</h1>`
```

**The same-component trap.** Going from `/users/1` to `/users/2` matches the same
component, which stays mounted. `onCreate` does **not** run again. Either read
`router.params()` in the template, or implement `onRouteChange(change)` to refetch:

```typescript
onRouteChange(change: IRouteChange): void {
	void this.load(change.params.id);
}
```

`onRouteChange` fires when the params, the query string or the resolved data change while
the component stays mounted, so it also covers `/search?q=a` → `/search?q=b`.

**Paths are absolute.** `navigate('about')` means `/about`. A route-level `redirectTo`
carries the query string and fragment across unless the target sets its own.

---

## 10. Forms

```typescript
import { createFormGroup, createFormControl, Validators } from '@melodicdev/core/forms';

export class SignupComponent {
	readonly form = createFormGroup({
		name: createFormControl<string>('', { validators: [Validators.required] }),
		email: createFormControl<string>('', { validators: [Validators.required, Validators.email] })
	});

	submit = (event: Event): void => {
		event.preventDefault();
		this.form.markAllAsTouched();          // shows every error
		if (this.form.invalid()) return;
		void this.save(this.form.value());
	};
}
```

```typescript
html`
	<form @submit=${self.submit}>
		<ml-input label="Name" :formControl=${self.form.get('name')}></ml-input>
		<ml-input label="Email" :formControl=${self.form.get('email')}></ml-input>
		<ml-button type="submit" ?disabled=${self.form.invalid()}>Sign up</ml-button>
	</form>
`;
```

What you get without writing anything else:

- The component re-renders on any form state change, because it holds the form in a field.
- `:formControl` syncs the value both ways, marks the control touched on blur, and adds
  `mf-valid` / `mf-invalid` / `mf-dirty` / `mf-touched` classes.
- When a control is touched and invalid, the directive sets the element's `error`
  attribute to the resolved message. `ml-*` form components display it. Do not add your
  own `error=${...}` bindings.
- The form is destroyed with the component.

Semantics to know:

| Behaviour | Detail |
|---|---|
| `value()` excludes disabled controls | Use `getRawValue()` for everything |
| Disabled controls are excluded from validity | A disabled required field does not block submit |
| `setValue` is strict, `patchValue` is lenient | `FormGroup.setValue` throws unless the keys match exactly |
| Programmatic `setValue` does not mark dirty | Only user input does. Call `markAsDirty()` yourself if needed |
| `setValue` / `patchValue` write to disabled controls | `disabled` keeps the user out, not your code, so `form.patchValue(serverData)` fills read-only fields |
| `markAsTouched()` touches one control | `markAllAsTouched()` cascades. Use it on submit |
| `updateOn: 'blur' \| 'submit'` | Controls when user input is written to the model. A programmatic `setValue` always validates |

Validators return an error **code**; the message is resolved separately, in this order:
the control's own `messages`, its parent chain, the validator's default, the global
registry (`registerDefaultMessages`). Write custom validators with
`createValidator(code, predicate, message)` and `createAsyncValidator`.

**A single value with no validation** does not need a form. Bind a signal two-way:

```typescript
query = signal('');
// html`<ml-input label="Search" :model=${self.query}></ml-input>`
```

A custom form element is taught to the forms system with `registerAdapter`. See
`docs/FORMS.md`.

---

## 11. HTTP

Register one shared client in bootstrap with `provideHttp`, and inject it. Do not create
clients ad hoc with `new HttpClient()` in application code, because they would not share
interceptors.

```typescript
@Injectable()
export class UserService {
	@Service(HttpClient) private _http!: HttpClient;

	async list(): Promise<User[]> {
		const response = await this._http.get<User[]>('/users', { params: { limit: 50 } });
		return response.data;                 // the body is on .data, not the response itself
	}

	create(user: NewUser) {
		return this._http.post<User>('/users', user);
	}
}
```

- Every method resolves to `{ data, status, headers, config }`.
- Request options: `params`, `headers`, `timeout` (ms), `signal` (an `AbortSignal`),
  `responseType`, `credentials`, `mode`, `deduplicate`, `onProgress`.
- The body is decoded from the response's content type: JSON types (including
  `application/problem+json` and other `+json` types) are parsed, `text/*` is a string,
  known binary types are a `Blob`. Pass `responseType: 'blob'` (or `'text'`,
  `'arrayBuffer'`, `'json'`) to decide yourself, for example for file downloads.
- Identical in-flight `GET`s are deduplicated by default.
- The client's `defaultHeaders` and `credentials` are sent only to the `baseURL` origin
  and the page's own origin. A request to an absolute URL elsewhere does not get them, so
  a default `Authorization` header never leaks to a third party. Headers set on the
  request itself are always sent. `allowCrossOriginDefaults: true` on the client config
  turns this off.
- Catch by class, not by message:

```typescript
try {
	await this._http.get('/thing');
} catch (error) {
	if (error instanceof HttpError) error.response?.status;   // the server answered with an error
	else if (error instanceof NetworkError) { /* no response: offline, DNS, CORS */ }
	else if (error instanceof AbortError) { /* cancelled or timed out */ }
}
```

**Interceptors** are passed to `provideHttp`. A response interceptor's `error` handler can
recover or retry; `retry()` re-runs request interceptors, so a refreshed token is picked up.

```typescript
const authInterceptor: IHttpRequestInterceptor = {
	intercept: async (request) => ({
		...request,
		headers: { ...request.headers, Authorization: `Bearer ${inject(AuthService).token()}` }
	})
};

const refreshInterceptor: IHttpResponseInterceptor = {
	intercept: async (response) => response,
	error: async (error, { retry, retryCount }) => {
		if (!(error instanceof HttpError) || error.response?.status !== 401 || retryCount > 0) throw error;
		await inject(AuthService).refresh();
		return retry();
	}
};
```

---

## 12. State

Use the store when several features share state that changes through named actions, or
when you want effects for async flows. For simpler cases, a service with signals
(section 7) is less code.

```typescript
// state/todos.ts
export const addTodo = createAction('[Todos] Add', props<{ text: string }>());
export const loadTodos = createAction('[Todos] Load');

export interface AppState {
	todos: string[];
	loading: boolean;
}

export const appState = createState<AppState>({ todos: [], loading: false });

export const appReducers = {
	// name the state and the slice, or the reducer's `todos` argument is `unknown`
	todos: createReducer<AppState, 'todos'>(
		onAction(addTodo, (todos, action) => [...todos, action.payload.text])
	)
};

@Injectable()
export class TodosEffects extends EffectsBase {
	constructor() {
		super();
		this.addEffect([loadTodos], async () => {
			const first = await fetchFirstTodo();
			return addTodo({ text: first });           // the returned action is dispatched
		});
	}
}

// main.ts
providers: [provideRX(appState, appReducers, { todos: TodosEffects })]
```

```typescript
export class TodoListComponent {
	@Service(SignalStoreService) private _store!: SignalStoreService<AppState>;

	todos = this._store.select('todos', (todos) => todos);       // (slice key, selector over that slice)

	add = (text: string): void => this._store.dispatch(addTodo({ text }));
}
```

- A reducer receives **its slice** and returns the new slice. Return a new value; do not
  mutate.
- `select(key, selectFn, cacheKey?)` returns a read-only signal. Created in a component
  field, it lives and dies with the component.
- Calling `select` inside a template or getter is supported; pass a `cacheKey` when the
  selector closes over a variable, so it is reused across renders:
  `` this._store.select('account', (a) => a.permissions.includes(perm), `perm:${perm}`)() ``.
- **Outside a component** (guards, resolvers, services) use `store.snapshot()` or
  `store.snapshotSlice('cart')`. A `select()` there is never cleaned up.
- State owned by one feature rather than the whole app goes in a
  `ComponentStateBaseService` subclass, which has the same `select` contract.

---

## 13. Configuration

```typescript
// config/app.config.ts
import { defineConfig } from '@melodicdev/core/config';

export const appConfig = defineConfig({
	base: { appName: 'My App', apiBaseURL: '/api', features: { beta: false } },
	qa: { apiBaseURL: 'https://qa-api.example.com' },
	prod: { apiBaseURL: 'https://api.example.com', features: { beta: true } }
});

export type AppConfig = typeof appConfig;
```

- The result is a plain object resolved at import time. Import it directly where that is
  convenient, or register it with `provideConfig(appConfig)` and inject `APP_CONFIG`.
- Environment blocks **deep-merge** into `base` (arrays replace).
- The environment is `VITE_ENV` when set to `dev`/`qa`/`prod`, otherwise it follows Vite's
  mode (`vite build --mode qa` gives `qa`), otherwise `prod` for production builds and
  `dev` for everything else.
- In a monorepo, apps extend a shared config: `defineConfig({ extends: sharedConfig, base: {...} })`.
- This is separate from `devMode`, which only controls framework diagnostics.

---

## 14. The UI component library

### Setup

```bash
npm install @melodicdev/components @melodicdev/core
```

```html
<!-- index.html: tokens, light and dark themes, icon fonts -->
<html data-theme="light">
<link melodic-styles rel="stylesheet" href="/assets/melodic-components.css">
```

Copy `node_modules/@melodicdev/components/assets` into your build output (for example
with `vite-plugin-static-copy`) or link the same file from a CDN pinned to your major
version.

Import each component you use, once, anywhere before it renders. Importing registers the
element:

```typescript
import '@melodicdev/components/button';
import '@melodicdev/components/input';
import '@melodicdev/components/table';
```

Import from the per-component path, not the package root, so the bundle only contains what
you use.

### Conventions shared by every component

- Tags are `ml-*`. Events are `ml:*` and are listened to like any other event:
  `<ml-button @ml:click=${self.save}>`. Read results from `event.detail`.
- Simple values are attributes (`variant="outline"`, `size="sm"`, `disabled`). Data is a
  property (`.rows=${rows}`, `.columns=${columns}`, `.options=${options}`).
- **Call methods on the component instance, not the element.** A component's data
  properties are mirrored onto its host element; methods declared on its class are not.
  `drawerEl.component.open()` works; `drawerEl.open()` is not a function. Each component's
  Methods line in `MELODIC_COMPONENTS.md` says where its methods can be called.
- Shared types: `Size` is `'xs' | 'sm' | 'md' | 'lg' | 'xl'`; `error` is the status
  variant for destructive or failed states.
- Form components (`ml-input`, `ml-textarea`, `ml-select`, `ml-autocomplete`,
  `ml-checkbox`, `ml-radio-group`, `ml-radio-card-group`, `ml-button-group`, `ml-toggle`,
  `ml-slider`, `ml-date-picker`, `ml-time-picker`, `ml-date-time-picker`,
  `ml-file-upload`) work with `:formControl` and `:model`. Each registers its adapter when
  its module is imported.
- `ml-button type="submit"` really submits the enclosing form.

### What exists

| Area | Components |
|---|---|
| Forms | `ml-button`, `ml-button-group`, `ml-input`, `ml-textarea`, `ml-checkbox`, `ml-radio`, `ml-radio-group`, `ml-radio-card-group`, `ml-toggle`, `ml-select`, `ml-autocomplete`, `ml-slider`, `ml-date-picker`, `ml-time-picker`, `ml-date-time-picker`, `ml-file-upload`, `ml-form-field` |
| Layout | `ml-card`, `ml-divider`, `ml-stack`, `ml-container`, `ml-app-shell`, `ml-page-header`, `ml-page-section`, `ml-hero-section` |
| Data | `ml-table`, `ml-data-grid`, `ml-list`, `ml-avatar`, `ml-badge`, `ml-badge-group`, `ml-tag`, `ml-stat-card`, `ml-profile-card`, `ml-activity-feed`, `ml-calendar-view` |
| Navigation | `ml-tabs`, `ml-breadcrumb`, `ml-pagination`, `ml-sidebar`, `ml-steps` |
| Overlays | `ml-dialog`, `ml-drawer`, `ml-popover`, `ml-dropdown`, `ml-tooltip` |
| Feedback | `ml-spinner`, `ml-alert`, `ml-progress`, `ml-toast` |
| Pages | `ml-login-page`, `ml-signup-page`, `ml-dashboard-page` |
| General | `ml-icon` (Phosphor icons by name: `<ml-icon icon="gear">`) |

Before building a custom widget, check this list. Before using a component, read its
section in `MELODIC_COMPONENTS.md` for the exact attributes, events, slots and tokens;
do not guess attribute or event names.

### Patterns worth knowing

**Tables.** Use layout from the component, data by property:

```typescript
const columns: TableColumn[] = [
	{ key: 'name', label: 'Name', sortable: true },
	{ key: 'status', label: 'Status', render: (value) => html`<ml-badge>${value}</ml-badge>` }
];

html`<ml-table clickable-rows .columns=${columns} .rows=${self.rows()} @ml:row-click=${self.open}></ml-table>`;
```

Set `row-key="id"` (or `.rowKey=${(row) => ...}`) when a custom `render` cell holds state
such as an input or an open menu. Rows are keyed by position by default, so after a sort
the DOM of row *N* is reused for whichever record is now at *N*.

For large datasets add `virtual` and give the **parent** a defined height.
`ml-data-grid` adds filtering, column operations and pagination. `ml-list` is slot-based
and cannot virtualize.

**Dialogs.** Inject `DialogService` and open a component; the result arrives in
`afterClosed`, which also fires (with `undefined`) when the user dismisses with Escape or
the backdrop:

```typescript
import '@melodicdev/components/dialog';
import { DialogService } from '@melodicdev/components/dialog';

@Service(DialogService) private _dialog!: DialogService;

confirmDelete(): void {
	const ref = this._dialog.open(ConfirmDialogComponent, { data: { name: this.name }, size: 'sm' });
	ref?.afterClosed((confirmed) => { if (confirmed === true) void this.delete(); });
}
```

The dialog component's template renders an `<ml-dialog>`, and the class implements
`onDialogRefSet(ref)` to receive its `DialogRef`: `ref.data` is the `data` passed to
`open`, and `ref.close(result)` closes it. An inline `<ml-dialog #confirm>` in your own
template is opened by name: `this._dialog.open('confirm')`, and closed with
`this._dialog.close('confirm', result)`. The id is a plain string.

Give `ml-dialog`, `ml-drawer` and `ml-popover` a `label` when they have no visible header,
so screen readers announce more than "dialog".

**Toasts.** No markup needed:

```typescript
import '@melodicdev/components/toast';
import { ToastService } from '@melodicdev/components/toast';

@Service(ToastService) private _toasts!: ToastService;

this._toasts.success('Saved', 'Your changes have been saved.');
```

**Floating UI of your own.** Use `computePosition` and `autoUpdate` from
`@melodicdev/components/utils` with the Popover API, the same way the built-in overlays
do. `focusTrap`, `announce` and `clickOutside` cover the accessibility side.

---

## 15. Theming and styling

**Light, dark, system:**

```typescript
import { applyTheme, toggleTheme } from '@melodicdev/components/theme';

applyTheme('system');   // 'light' | 'dark' | 'system'
toggleTheme();
```

**A brand theme:**

```typescript
import { injectTheme, createBrandTheme } from '@melodicdev/components/theme';

injectTheme('brand', { '--ml-color-primary': '#7c3aed', '--ml-color-primary-hover': '#6d28d9' });
document.documentElement.setAttribute('data-theme', 'brand');
```

`applyTheme` and a custom `data-theme` are mutually exclusive: calling `applyTheme`
afterwards overwrites the custom theme.

**Three levels of override**, from broadest to narrowest:

```css
/* 1. Global tokens: changes every component that uses them */
:root { --ml-color-primary: #7c3aed; --ml-radius: 0.375rem; }

/* 2. A component token inherited from an ancestor: every ml-button inside .toolbar */
.toolbar { --ml-button-font-weight: 400; }

/* 3. A component token on specific elements */
ml-button.cta { --ml-button-font-weight: 700; --ml-button-border-radius: 999px; }
```

- Component tokens are named `--ml-{component}-{state?}-{property}`
  (`--ml-button-hover-bg`). Each component's full list, with defaults, is in the comment
  block at the top of its styles file and in `MELODIC_COMPONENTS.md`.
- Since 4.0.1 a component token set on **any ancestor** is inherited, including on the
  `:host` of your own wrapper component.
- Variant and size modifiers reassign some tokens on the component's inner element, and
  those cannot be overridden from outside. This matters most for `ml-button`: every
  variant (including the default `primary`) owns the color tokens such as
  `--ml-button-bg`, and every size owns the sizing tokens. To recolor a button, pick a
  `variant` or change the global token it points at (`--ml-color-primary`). Each
  component's section in `MELODIC_COMPONENTS.md` says which tokens are overridable.
- **Use tokens in your own component styles** (`var(--ml-space-4)`, `var(--ml-color-text)`,
  `var(--ml-radius)`) instead of literal values, so your components follow the theme and
  dark mode.
- The library honours `prefers-reduced-motion` (the `--ml-duration-*` tokens become zero),
  forced-colors mode, and `dir="rtl"` for most components. Use the duration tokens and
  logical properties (`margin-inline-start`, `padding-inline`) in your own styles to get
  the same behaviour.
- Do not try to style a component's internals with descendant selectors. They are in
  shadow DOM and the selector will never match.

---

## 16. Testing

```bash
melodic add testing        # Vitest + happy-dom setup
```

```typescript
import { mount, flush, query, text, captureEvents, unmountAll } from '@melodicdev/core/testing';
import './user-card.component';

afterEach(unmountAll);

it('emits when toggled', async () => {
	const el = await mount<UserCardComponent>('user-card', { userId: '7' });
	const events = captureEvents<{ open: boolean }>(el, 'user-card:toggle');

	query<HTMLButtonElement>(el, 'button')!.click();
	await flush();

	expect(events()[0].detail.open).toBe(true);
	expect(el.component.expanded()).toBe(true);
});
```

- `mount(selector, properties?, { attributes?, container? })` assigns properties before
  connecting, like a parent's `.prop=` bindings, and waits for the first render. It throws
  if the component module was not imported.
- **`await flush()` after anything that should cause a render or a teardown.** Renders run
  on a microtask; asserting right after a click sees the previous DOM.
- `query`, `queryAll` and `text` look inside the shadow root.
- `@Service` fields are writable. Replace a dependency for one instance by assigning the
  field on `el.component`, then `base(el).requestRender()` and `flush()` (`base` is
  exported from `@melodicdev/core/testing`). For an injector-wide
  fake, `Injector.bindValue(Token, fake)` before mounting.
- Signals and effects are synchronous and need no flush. `RouterService` can be
  constructed directly (`new RouterService()`, `setRoutes`, `navigate`, `destroy`).

---

## 17. Mistakes to avoid

| Mistake | What happens | Do this instead |
|---|---|---|
| `this.items.push(x)` | No re-render | `this.items = [...this.items, x]`, or a signal with `.update()` |
| A field named `title`, `hidden`, `id`, … | Not mirrored onto the element; dev warning | Rename: `cardTitle`, `isHidden` |
| An input field with no initializer (`user?: User`) | A parent's `.user=${x}` does nothing; dev warning | `user: User \| undefined = undefined` |
| `href=${userSuppliedUrl}` or an `onclick="…"` attribute binding | A `javascript:` URL or inline handler runs script; dev warning | Validate URLs; use `@click=${handler}` |
| `computed()` inside the template or a getter the template calls | A new computed every render; dev warning | Create it in a field initializer or `onInit` |
| Writing a reactive field in `onRender` | Render loop, stopped after 25 renders | Derive the value with `computed()`, or write it in the handler that caused the change |
| Expecting `onCreate` to re-run when route params change | Stale data on `/users/1` → `/users/2` | Read `router.params()` in the template, or implement `onRouteChange` |
| Expecting a signal read in a hook to re-run the hook | Nothing happens | Use `effect()` |
| `disabled=${count}` with a non-boolean (`0`, `''`) | Written as text (`disabled="0"`), so still disabled | `?disabled=${count}` |
| `items=${array}` | The array is stringified | `.items=${array}` |
| `<input .value=${self.text}>` for an editable field | Resetting to the same value leaves the typed text | `.value=${live(self.text)}` or `:model=${signal}` |
| `.map()` for a sortable or filterable list | Focus and per-row state land on the wrong row | `repeat(items, keyFn, template)` |
| `styleMap({ width: 200 })` | Invalid CSS, silently dropped | `` styleMap({ width: `${n}px` }) `` |
| `new CustomEvent('x', { bubbles: true })` from a component | Stops at the shadow boundary without `composed` | `emit(this.elementRef, 'x', detail)` |
| `el.open()` on a component element | Not a function: methods are not mirrored onto the host | `el.component.open()` |
| `ml-button { --ml-button-bg: … }` | No effect: the variant class owns that token | Choose a `variant`, or set `--ml-color-primary` |
| Using a component without importing its module | An inert unknown element, no error | Import the module (or lazy-load it in the route) |
| `store.select()` in a guard or service | A computed that is never destroyed | `store.snapshot()` / `store.snapshotSlice(key)` |
| `form.markAsTouched()` on submit | Only the group is touched; child errors stay hidden | `form.markAllAsTouched()` |
| `form.setValue({ onlySomeKeys })` | Throws | `form.patchValue(...)` |
| Reading `response` as the body | It is `{ data, status, headers }` | `response.data` |
| `new HttpClient()` in a service | Bypasses the app's interceptors | Inject the shared client from `provideHttp` |
| Calling `applyTheme()` after setting a custom `data-theme` | The custom theme is overwritten | Use one or the other |
| CSS selectors aimed at a component's internals | Never match (shadow DOM) | Set the component's `--ml-*` tokens |
| `virtual` on a table whose parent has no height | Nothing visible, or everything rendered | Give the parent a defined height |
| `devMode: true` in production | Every diagnostic ships to users | Leave `devMode` unset |
| Relying on route guards for security | Lazy chunks and APIs are still reachable | Enforce authorization on the server |

---

## 18. Where the full reference lives

In the Melodic repository:

| Need | File |
|---|---|
| Every core API with signatures, in one file | `MELODIC_FRAMEWORK.md` |
| Every `ml-*` component: attributes, events, slots, tokens | `MELODIC_COMPONENTS.md` |
| Every export, grouped by who it is for | `docs/API_SURFACE.md` |
| Components and lifecycle | `docs/COMPONENT_SYSTEM.md` |
| Templates and directives | `docs/TEMPLATE_SYSTEM.md`, `docs/ATTRIBUTE_DIRECTIVES.md`, `docs/PORTAL.md` |
| Signals | `docs/SIGNALS.md` |
| Routing | `docs/ROUTING.md` |
| Forms | `docs/FORMS.md` |
| HTTP | `docs/HTTP.md` |
| Dependency injection | `docs/INJECTION.md` |
| State | `docs/STATE.md` |
| Configuration | `docs/CONFIG.md` |
| Bootstrap and dev mode | `docs/BOOTSTRAP.md` |
| Testing | `docs/TESTING.md` |
| Theming and tokens | `packages/melodic-components/docs/theming.md` |
| Positioning, focus, virtual scroll utilities | `packages/melodic-components/docs/utilities.md` |
| Per-category component guides | `packages/melodic-components/docs/components/*.md` |
| CLI commands | `packages/cli/README.md` |
| What changed between versions | `CHANGELOG.md`, `MIGRATION.md` |
