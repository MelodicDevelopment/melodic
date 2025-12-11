# Routing

Melodic includes a lightweight client-side router for single-page applications.

## Basic Setup

Import and register the routing components, then use them in your app:

```typescript
// main.ts
import './src/routing/components/router-outlet/router-outlet.component';
import './src/routing/components/router-link/router-link.component';
import './src/routing/services/router.service';
```

## Route Configuration

Define routes as an array of `IRoute` objects:

```typescript
import type { IRoute } from 'melodic';

const routes: IRoute[] = [
  { path: '', redirectTo: '/home' },
  { path: 'home', component: 'home-page' },
  { path: 'about', component: 'about-page' },
  { path: 'users/:id', component: 'user-detail' },
  { path: '404', component: 'not-found-page' }
];
```

### Route Properties

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | URL path to match (without leading slash) |
| `component` | `string` | Custom element tag name to render |
| `redirectTo` | `string` | Path to redirect to (with leading slash) |
| `loadComponent` | `() => Promise<unknown>` | Function for lazy loading |

## Components

### `<router-outlet>`

Renders the matched route's component:

```html
<router-outlet .routes=${routes}></router-outlet>
```

### `<router-link>`

Navigation links that use the router instead of full page loads:

```html
<router-link href="/home">Home</router-link>
<router-link href="/users/123">View User</router-link>
```

## Programmatic Navigation

Inject the `RouterService` to navigate programmatically:

```typescript
import { Service } from 'melodic';

class MyComponent {
  @Service('Router') private router!: RouterService;

  goToSettings() {
    this.router.navigate('/settings');
  }

  replaceCurrentRoute() {
    this.router.replace('/home'); // Doesn't add to history
  }
}
```

## Route Parameters

Use `:param` syntax for dynamic segments:

```typescript
{ path: 'users/:id', component: 'user-detail' }
{ path: 'posts/:category/:slug', component: 'post-page' }
```

Use `*` for wildcard matching:

```typescript
{ path: 'files/*path', component: 'file-browser' }
```

## Lazy Loading

Lazy loading defers loading of route components until they're needed, reducing initial bundle size.

### Basic Lazy Loading

Add `loadComponent` to your route:

```typescript
const routes: IRoute[] = [
  // Eager loaded (in main bundle)
  { path: 'home', component: 'home-page' },

  // Lazy loaded (separate chunk, loaded on demand)
  {
    path: 'settings',
    component: 'settings-page',
    loadComponent: () => import('./pages/settings/settings-page.component')
  }
];
```

### How It Works

1. User navigates to `/settings`
2. Router detects `loadComponent` on the matched route
3. Dynamic import loads the component module
4. `@MelodicComponent` decorator registers the custom element
5. Router creates and renders `<settings-page>`

Vite automatically code-splits dynamic imports into separate chunks.

### Module Lazy Loading

For features with multiple components, create a module file:

```typescript
// features/admin/admin.module.ts
import './admin-dashboard.component';
import './admin-users.component';
import './admin-reports.component';
```

Then reference the module in your route:

```typescript
{
  path: 'admin',
  component: 'admin-dashboard',
  loadComponent: () => import('./features/admin/admin.module')
}
```

All components in the module are registered when the module loads.

### Verifying Lazy Loading

1. Open browser DevTools → Network tab
2. Navigate to a lazy-loaded route
3. Observe the new JS chunk being fetched
4. Add `console.log` in the component file to confirm load timing

## Complete Example

```typescript
// app.component.ts
import { MelodicComponent, html, css } from 'melodic';
import type { IRoute } from 'melodic';
import { appTemplate } from './app.template';
import { appStyles } from './app.styles';

const routes: IRoute[] = [
  { path: '', redirectTo: '/home' },
  { path: 'home', component: 'home-page' },
  { path: 'about', component: 'about-page' },
  {
    path: 'settings',
    component: 'settings-page',
    loadComponent: () => import('./pages/settings/settings-page.component')
  },
  { path: '404', component: 'not-found-page' }
];

@MelodicComponent({
  selector: 'my-app',
  template: appTemplate,
  styles: appStyles
})
export class AppComponent {
  routes = routes;
}
```

```typescript
// app.template.ts
import { html } from 'melodic';
import type { AppComponent } from './app.component';

export function appTemplate(self: AppComponent) {
  return html`
    <nav>
      <router-link href="/home">Home</router-link>
      <router-link href="/about">About</router-link>
      <router-link href="/settings">Settings</router-link>
    </nav>
    <main>
      <router-outlet .routes=${self.routes}></router-outlet>
    </main>
  `;
}
```
