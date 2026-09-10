# Routing

Melodic includes a lightweight client-side router for single-page applications with nested routes, guards, resolvers, and lazy loading.

## Table of Contents

- [Setup](#setup)
- [Route Configuration](#route-configuration)
- [Router Outlet](#router-outlet)
- [Router Links](#router-links)
- [Guards](#guards)
- [Resolvers](#resolvers)
- [Route Data and Params](#route-data-and-params)
- [Programmatic Navigation](#programmatic-navigation)

## Setup

Import the routing package so the router components and directives are registered.

```typescript
import '@melodicdev/core/routing';
```

## Route Configuration

Define routes as an array of `IRoute` objects:

```typescript
import type { IRoute } from '@melodicdev/core';

const routes: IRoute[] = [
	{ path: '', redirectTo: '/home' },
	{ path: 'home', component: 'home-page', name: 'home' },
	{ path: 'users/:id', component: 'user-detail', name: 'user.detail' },
	{
		path: 'settings',
		component: 'settings-page',
		loadComponent: () => import('./pages/settings-page.component')
	}
];
```

Route properties:

- `path`: URL path segment (no leading slash)
- `component`: custom element tag name to render
- `redirectTo`: redirect path (with leading slash)
- `loadComponent`: lazy-load function for a component module
- `loadChildren`: lazy-load child routes
- `children`: nested route definitions
- `canActivate` / `canDeactivate`: guard arrays
- `resolve`: data resolvers
- `data`: arbitrary static route data
- `name`: named route for `navigateByName`

## Router Outlet

`<router-outlet>` renders the matched component and supports nested outlets.

```html
<router-outlet .routes=${routes}></router-outlet>
```

For nested routing, include additional outlets inside routed components. Each outlet renders the route at its own depth of the **committed match chain**; outlets never match the URL themselves.

## Lazy Loading

`loadChildren` and `loadComponent` are resolved by the router **inside the navigation pipeline**, before guards and resolvers run and before anything is committed:

```typescript
{
	path: 'admin',
	component: 'admin-layout',
	loadChildren: () => import('./admin/admin.routes').then((m) => ({ routes: m.routes }))
}
```

The pipeline matches as far as it can, loads the lazy configuration it hit, re-matches to extend the chain into the loaded routes, and repeats until the chain is complete. Every guard and resolver on the full chain — lazily loaded children and default (`path: ''`) children included — then runs before the outlets render. A failed load fails the navigation (`{ success: false, error }`); on initial load or back/forward it renders the 404 view instead. Each `loadChildren`/`loadComponent` function is invoked once and its promise shared, so concurrent navigations never double-load a chunk.

Note that loading happens before the parent's own `canActivate` guards run, so a chunk may be downloaded for a route the user is then denied. Chunks are public assets; enforce authorization on the server.

## Router Links

You can use either the `<router-link>` component or the `:routerLink` attribute directive.

### `<router-link>` Component

```html
<router-link href="/home">Home</router-link>
<router-link href="/users/123">User</router-link>
```

### `:routerLink` Attribute Directive

```html
<a :routerLink="/home">Home</a>
<button :routerLink="/settings">Settings</button>
<a :routerLink=${{ href: '/about', exactMatch: true, activeClass: 'current' }}>About</a>
```

The directive automatically:

- sets `href` on anchor elements
- manages the active class
- supports modifier-key navigation (open in new tab)

## Guards

Guards allow or block navigation. Use `createGuard` or `createDeactivateGuard` helpers.

```typescript
import { createGuard } from '@melodicdev/core/routing';

export const authGuard = createGuard(({ queryParams }) => {
	const token = queryParams.get('token');
	return Boolean(token) || '/login';
});
```

Apply guards to routes:

```typescript
{ path: 'admin', component: 'admin-page', canActivate: [authGuard] }
```

## Resolvers

Resolvers load data before a route renders.

```typescript
import { createResolver } from '@melodicdev/core/routing';

export const userResolver = createResolver(async ({ params }) => {
	const response = await fetch(`/api/users/${params.id}`);
	return response.json();
});
```

Use in routes:

```typescript
{ path: 'users/:id', component: 'user-detail', resolve: { user: userResolver } }
```

## Route Data and Params

Access route data and params through `RouterService`:

```typescript
import { Service } from '@melodicdev/core';
import { RouterService } from '@melodicdev/core/routing';

class UserDetailComponent {
	@Service(RouterService) private router!: RouterService;

	onCreate(): void {
		const id = this.router.getParam('id');
		const data = this.router.getResolvedData();
		console.log(id, data.user);
	}
}
```

## Programmatic Navigation

```typescript
import { RouterService } from '@melodicdev/core/routing';

class NavMenuComponent {
	@Service(RouterService) private router!: RouterService;

	goHome(): void {
		void this.router.navigate('/home');
	}

	goByName(): void {
		void this.router.navigateByName('user.detail', { id: '123' });
	}
}
```
