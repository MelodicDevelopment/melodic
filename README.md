# Melodic

A lightweight, modern web component framework built on native browser APIs with TypeScript decorators, reactive signals, and an ultra-fast template system.

## CDN / No-Build Usage

All framework utilities are available directly from the CDN bundle — no npm, no bundler required:

```html
<script type="module">
  import { signal, computed, html, applyTheme } from 'https://unpkg.com/@melodicdev/core@1.3.2/bundle/melodic-core.min.js';

  const count = signal(0);
  const doubled = computed(() => count() * 2);

  console.log(doubled()); // 0
  count.set(5);
  console.log(doubled()); // 10
</script>
```

> **Note:** Authoring Melodic components with the `@MelodicComponent` decorator requires TypeScript and a build tool (Vite, etc.) due to decorator transform and class field semantics. The CDN bundle is best used for framework utilities (signals, routing, forms, HTTP, DI) or alongside pre-built UI components.

For a complete no-build UI solution, use `@melodicdev/components` instead — it includes the full framework and all UI components:

```html
<link melodic-styles rel="stylesheet"
      href="https://unpkg.com/@melodicdev/components@1.0.2/assets/melodic-components.min.css">
<script type="module"
        src="https://unpkg.com/@melodicdev/components@1.0.2/assets/melodic-components.min.js"></script>
```

See the [`@melodicdev/components` README](./packages/melodic-components/README.md) for full CDN usage details.

---

## Install

```bash
npm install @melodicdev/core
```

Install the CLI globally (optional but recommended):

```bash
npm install -g @melodicdev/cli
melodic --help
```

## Quick Start (CLI)

```bash
melodic init my-app
cd my-app
npm install
npm run dev
```

## Quick Start (Manual)

```typescript
import { MelodicComponent, html, css, signal } from '@melodicdev/core';

@MelodicComponent({
	selector: 'hello-world',
	template: (self) => html`
		<section>
			<h1>Hello, ${self.name()}!</h1>
			<button @click=${self.increment}>Clicks: ${self.count()}</button>
		</section>
	`,
	styles: () => css`
		:host {
			display: block;
			font-family: sans-serif;
		}
		button {
			margin-top: 0.5rem;
		}
	`
})
export class HelloWorldComponent {
	name = signal('World');
	count = signal(0);

	increment = () => this.count.update((value) => value + 1);
}
```

Use it in HTML:

```html
<hello-world></hello-world>
```

## Web Apps

- `web/example` is the demo app. Run with `npm run dev`.
- `web/benchmark` is the performance suite. Run with `npm run dev:benchmark` and update bundle sizes with `npm run benchmark:update`.

## Core Concepts

### Components

```typescript
import { MelodicComponent, html, css } from '@melodicdev/core';

@MelodicComponent({
	selector: 'user-card',
	template: (self) => html`
		<article>
			<h2>${self.name}</h2>
			<p>${self.role}</p>
		</article>
	`,
	styles: () => css`
		:host { display: block; }
		article { padding: 1rem; border: 1px solid #eee; }
	`
})
export class UserCardComponent {
	name = 'Ada Lovelace';
	role = 'Engineer';
}
```

Import template and styles from separate files:

```typescript
import { MelodicComponent } from '@melodicdev/core';
import { profileTemplate } from './profile.template';
import { profileStyles } from './profile.styles';

@MelodicComponent({
	selector: 'user-profile',
	template: profileTemplate,
	styles: profileStyles
})
export class UserProfileComponent {
	name = 'Ada Lovelace';
	role = 'Engineer';
}
```

Global styles: if you add a `<style>` or `<link>` tag with the `melodic-styles` attribute, Melodic will share it across components. If you never call `setGlobalStylesAttribute`, Melodic defaults to `melodic-styles`. For Vite builds, link a file under `/src` (for example `/src/styles/global.css`) to get minified, hashed output; link a public asset (for example `/styles/global.css`) if you want to preserve the path.

Lifecycle hooks available on the component instance:

- `onInit`, `onCreate`, `onRender`, `onDestroy`
- `onPropertyChange(name, oldVal, newVal)`
- `onAttributeChange(name, oldVal, newVal)`

### Templates and Bindings

```typescript
import { html, classMap, styleMap } from '@melodicdev/core';

html`
	<input .value=${value} @input=${onInput} />
	<button class=${classMap({ active: isActive })}>Toggle</button>
	<div style=${styleMap({ backgroundColor: color })}></div>
`;
```

Binding prefixes:

- text interpolation: `${value}`
- attribute: `attr=${value}`
- property: `.prop=${value}`
- event: `@event=${handler}`
- attribute directive: `:directive=${value}`

### Signals

```typescript
import { signal, computed } from '@melodicdev/core';

const price = signal(10);
const qty = signal(2);
const total = computed(() => price() * qty());
```

Signals on component instances are automatically subscribed to and re-render the component when they change.

### Routing

```typescript
import type { IRoute } from '@melodicdev/core';

const routes: IRoute[] = [
	{ path: '', redirectTo: '/home' },
	{ path: 'home', component: 'home-page', name: 'home' },
	{ path: 'users/:id', component: 'user-detail', name: 'user.detail' },
	{
		path: 'settings',
		component: 'settings-page',
		loadComponent: () => import('./settings-page.component')
	}
];
```

```html
<nav>
	<a :routerLink="/home">Home</a>
	<a :routerLink="/settings">Settings</a>
</nav>
<router-outlet .routes=${routes}></router-outlet>
```

### State (Signal Store)

```typescript
import { createState, createAction, props, onAction, createReducer, provideRX } from '@melodicdev/core/state';

const addTodo = createAction('[Todos] Add', props<{ text: string }>());

const state = createState({ todos: [] as string[] });
const reducers = {
	todos: createReducer(
		onAction(addTodo, (current, action) => [...current, action.payload.text])
	)
};

// register in bootstrap: provideRX(state, reducers, { todos: TodosEffects })
```

### Forms

```typescript
import { createFormGroup, createFormControl, Validators } from '@melodicdev/core/forms';

const form = createFormGroup({
	email: createFormControl('', { validators: [Validators.required, Validators.email] })
});
```

```typescript
import { html } from '@melodicdev/core/template';

html`
	<input type="email" :formControl=${form.get('email')} />
`;
```

### HTTP Client

```typescript
import { HttpClient } from '@melodicdev/core/http';

const http = new HttpClient({ baseURL: 'https://api.example.com' });
const response = await http.get('/users');
```

### Dependency Injection

```typescript
import { Injectable, Service, html, MelodicComponent } from '@melodicdev/core';

@Injectable()
class ApiService {
	getStatus(): string {
		return 'ok';
	}
}

@MelodicComponent({ selector: 'status-pill', template: () => html`<div></div>` })
class StatusPillComponent {
	@Service(ApiService) private api!: ApiService;
}
```

### Bootstrap

```typescript
import { bootstrap } from '@melodicdev/core';
import './components/app-root.component';

await bootstrap({
	rootComponent: 'app-root',
	target: '#app',
	devMode: true
});
```

## Documentation

- [Component System](./docs/COMPONENT_SYSTEM.md)
- [Template System](./docs/TEMPLATE_SYSTEM.md)
- [Attribute Directives](./docs/ATTRIBUTE_DIRECTIVES.md)
- [Routing](./docs/ROUTING.md)
- [Portal](./docs/PORTAL.md)
- [Bootstrap](./docs/BOOTSTRAP.md)
- [Signals](./docs/SIGNALS.md)
- [State](./docs/STATE.md)
- [HTTP Client](./docs/HTTP.md)
- [Dependency Injection](./docs/INJECTION.md)
- [Forms](./docs/FORMS.md)
- [Upcoming Features](./docs/UPCOMING_FEATURES.md)

## Publishing

Framework build and publish:

```bash
npm run build:lib
npm publish --access public
```

CLI build and publish:

```bash
npm --workspace @melodicdev/cli run build
npm publish --workspace @melodicdev/cli --access public
```

## License

MIT
