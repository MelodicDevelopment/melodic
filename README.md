# Melodic

A lightweight, modern web component framework built on native browser APIs with TypeScript decorators, reactive signals, and an ultra-fast template system.

## Introduction

Melodic is a minimalist framework for building web applications using native Web Components. Instead of relying on a virtual DOM, Melodic uses a "parse-once, update-forever" strategy that directly manipulates the DOM for optimal performance. Components are defined using TypeScript decorators and rendered with tagged template literals, making the API intuitive for developers familiar with modern frameworks.

The framework embraces web standards: Shadow DOM for encapsulation, custom elements for component registration, and ES modules for code organization. This means Melodic components work seamlessly with any other web technology.

## Publishing

Package build and publish commands:

```bash
npm run build:lib
npm publish --access public
```

## Key Features

### Decorator-Based Components

Define components with a clean, declarative syntax using the `@MelodicComponent` decorator:

```typescript
import { MelodicComponent, html, css } from 'melodic';

@MelodicComponent({
  selector: 'hello-world',
  template: (self) => html`<h1>Hello, ${self.name}!</h1>`,
  styles: () => css`:host { display: block; font-family: sans-serif; }`
})
export class HelloWorldComponent {
  name = 'World';
}
```

### Reactive Signals

Fine-grained reactivity with signals that automatically trigger re-renders:

```typescript
import { signal, computed } from 'melodic';

class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  increment = () => this.count.set(this.count() + 1);
}
```

### Fast Template System

Tagged template literals with intelligent binding detection:

```typescript
import { html } from 'melodic';

// Event bindings with @
html`<button @click=${this.handleClick}>Click me</button>`

// Property bindings with .
html`<input .value=${this.name} @input=${this.updateName} />`

// Attribute bindings (default)
html`<div id=${this.id} class="container"></div>`
```

### Built-in Directives

Powerful directives for common patterns:

```typescript
import { repeat, when, classMap, styleMap, unsafeHTML } from 'melodic';

// Conditional rendering
when(this.isVisible, () => html`<div>Visible content</div>`)

// Efficient list rendering with keyed updates
repeat(this.items, (item) => item.id, (item) => html`<li>${item.name}</li>`)

// Dynamic classes
classMap({ active: this.isActive, disabled: !this.isEnabled })

// Dynamic inline styles
styleMap({ backgroundColor: this.color, transform: `scale(${this.scale})` })

// Raw HTML (use with trusted content only)
unsafeHTML(this.htmlContent)
```

### Dependency Injection

Service injection with decorators:

```typescript
import { Injectable, Service } from 'melodic';

@Injectable()
export class DataService {
  async fetchData() { /* ... */ }
}

@MelodicComponent({ /* ... */ })
export class MyComponent {
  @Service(DataService) private dataService!: DataService;
}
```

### Client-Side Routing

Full-featured router with lazy loading support:

```typescript
import type { IRoute } from 'melodic';

const routes: IRoute[] = [
  { path: '', redirectTo: '/home' },
  { path: 'home', component: 'home-page' },
  { path: 'users/:id', component: 'user-detail' },
  {
    path: 'settings',
    component: 'settings-page',
    loadComponent: () => import('./settings-page.component')
  }
];
```

```html
<nav>
  <router-link href="/home">Home</router-link>
  <router-link href="/settings">Settings</router-link>
</nav>
<router-outlet .routes=${routes}></router-outlet>
```

### Signal Store for State Management

Redux-inspired state management with signals:

```typescript
import { SignalStoreService } from 'melodic';

@MelodicComponent({ /* ... */ })
export class TodosComponent {
  @Service(SignalStoreService) private store!: SignalStoreService<AppState>;

  todos = this.store.select('todos', state => state.todos);

  addTodo = () => this.store.dispatch(addTodo({ text: 'New todo' }));
}
```

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd melodic
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage Example

Create a simple counter component:

```typescript
// counter.component.ts
import { MelodicComponent, html, css, signal } from 'melodic';

@MelodicComponent({
  selector: 'my-counter',
  template: (self) => html`
    <div class="counter">
      <p>Count: ${self.count()}</p>
      <button @click=${self.decrement}>-</button>
      <button @click=${self.increment}>+</button>
    </div>
  `,
  styles: () => css`
    .counter { display: flex; align-items: center; gap: 8px; }
    button { padding: 8px 16px; cursor: pointer; }
  `
})
export class CounterComponent {
  count = signal(0);

  increment = () => this.count.set(this.count() + 1);
  decrement = () => this.count.set(this.count() - 1);
}
```

Use it in your HTML:

```html
<my-counter></my-counter>
```

## Component Lifecycle

Melodic provides lifecycle hooks for component management:

| Hook | When Called |
|------|-------------|
| `onInit()` | Before DOM attachment, after property observation |
| `onCreate()` | After element is added to the DOM |
| `onRender()` | After each render |
| `onDestroy()` | When element is removed from the DOM |
| `onPropertyChange(name, oldVal, newVal)` | Before a property changes |
| `onAttributeChange(name, oldVal, newVal)` | When an observed attribute changes |

## Upcoming Features & Roadmap

### High Priority

- **HTTP Client Enhancements**: Retry logic, response caching, automatic request cancellation
- **Reactive Forms**: Form controls, validation, state tracking (dirty, touched, valid)
- **Router Enhancements**: Nested routes, route guards, query params, active link styling

### Medium Priority

- **Formatters**: Date, currency, number formatting with memoization
- **Advanced Content Projection**: Template inputs, slot content queries, slot change detection
- **Lifecycle Improvements**: Change detection info, `afterViewInit` / `afterContentInit` hooks
- **Module System**: Feature modules with provider scoping, shared modules

### Future Ideas

- **Animations**: Declarative animation API with enter/leave transitions
- **i18n**: Translation service with locale handling
- **Testing Utilities**: Component test harness, mock services
- **Component Library**: Pre-built UI components (modals, tables, forms, etc.)

## Documentation

- [Component System](./docs/COMPONENT_SYSTEM.md)
- [Template System](./docs/TEMPLATE_SYSTEM.md)
- [Routing](./docs/ROUTING.md)
- [Upcoming Features](./docs/UPCOMING_FEATURES.md)

## License

MIT
