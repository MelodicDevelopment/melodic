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

For nested routing, include additional outlets inside routed components.

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
