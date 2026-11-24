# App Bootstrap

Melodic includes a small bootstrap helper that wires up providers, global error handling, and (optionally) mounts a root component.

## Table of Contents

- [Overview](#overview)
- [Basic Usage](#basic-usage)
- [Config Options](#config-options)
- [Providers](#providers)
- [App Instance](#app-instance)
- [`devMode`](#devmode)
- [Ordering](#ordering)
- [The `melodic` console API](#the-melodic-console-api)

## Overview

Use `bootstrap()` to start an app and register providers. This gives you a simple place to configure the dependency injector, error handling, and root component mounting.

```typescript
import { bootstrap } from '@melodicdev/core';

await bootstrap({
	rootComponent: 'app-root',
	target: '#app'
});
```

## Basic Usage

```typescript
import { bootstrap } from '@melodicdev/core';
import './components/app-root.component';

await bootstrap({
	rootComponent: 'app-root',
	target: '#app'
});
```

### Mounting by Element Reference

```typescript
const target = document.getElementById('app');
if (target) {
	await bootstrap({
		rootComponent: 'app-root',
		target
	});
}
```

## Config Options

`bootstrap()` accepts the following options:

- `providers`: array of provider functions to register with the injector
- `devMode`: the framework-wide development switch; leave it unset to follow the build (see [`devMode`](#devmode))
- `onError`: global error handler for `error` and `unhandledrejection`; the second argument says which of the two fired
- `onBefore`: hook invoked (and awaited) before providers are registered
- `onReady`: synchronous hook invoked last, once the app instance exists
- `rootComponent`: custom element tag name to mount
- `target`: CSS selector or `HTMLElement` to append the root element to

All options are optional. The root component is mounted only when both `rootComponent` and
`target` are given. `bootstrap()` throws if the target selector matches nothing, or if
`rootComponent` is not a registered custom element — import the component file before
calling `bootstrap()`.

```typescript
await bootstrap({
	devMode: true,
	onBefore: async () => {
		// Load config, feature flags, etc.
	},
	onError: (error, context) => {
		console.error(`[${context}]`, error);
	},
	providers: [/* ... */]
});
```

## Providers

Providers register services and values with the injector. Melodic includes helpers like `provideHttp` and `provideRX`, and you can also define your own.

```typescript
import { bootstrap } from '@melodicdev/core';
import { provideHttp } from '@melodicdev/core/http';

await bootstrap({
	providers: [
		provideHttp({
			baseURL: 'https://api.example.com',
			defaultHeaders: { 'Content-Type': 'application/json' }
		})
	]
});
```

A provider is a function that receives the injector; the `Provider` type describes it.
Custom provider example:

```typescript
import { bootstrap } from '@melodicdev/core';
import type { Provider } from '@melodicdev/core';

const provideFlags = (): Provider => (injector) => {
	injector.bindValue('flags', { enableNewUI: true });
};

await bootstrap({
	providers: [provideFlags()]
});
```

## App Instance

`bootstrap()` returns an `IMelodicApp` instance with helpers and lifecycle controls.

```typescript
const app = await bootstrap({
	rootComponent: 'app-root',
	target: '#app'
});

const flags = app.get<Record<string, boolean>>('flags');
console.log(flags);

app.destroy();
```

`destroy()` removes the root element and the global error handlers, then runs the teardowns
its providers registered — `provideRouter()` releases the router's `popstate` /
`NavigationEvent` listeners and restores `history.scrollRestoration`. A custom provider can
register its own with `injector.addTeardown(() => …)`.

| Member | Meaning |
|---|---|
| `get(token)` | Resolve a dependency from the injector |
| `rootElement` | The mounted root element, or `undefined` when none was mounted |
| `http` | The `HttpClient` registered by `provideHttp`, or `undefined` without one |
| `isDevMode` | Whether dev mode was on when the app was bootstrapped |
| `destroy()` | Tears the app down, as described above, and releases the `'IMelodicApp'` binding. Safe to call more than once |

The app instance is also bound in the injector under the string token `'IMelodicApp'`:

```typescript
import { Injector } from '@melodicdev/core';
import type { IMelodicApp } from '@melodicdev/core';

const app = Injector.get<IMelodicApp>('IMelodicApp');
```

## `devMode`

`devMode` is the framework-wide development switch: template diagnostics, dev warnings and
the DevTools hook all consult it.

Left unset it follows the build — `import.meta.env.DEV` under a bundler, a localhost check
without one — which is almost always what you want. Pass it explicitly only to override
that:

```typescript
await bootstrap({ devMode: false }); // silence diagnostics on a localhost demo
```

Setting `devMode: true` in a production build ships every dev diagnostic to your users.

The same switch is available without `bootstrap()`:

```typescript
import { isDevMode, setDevMode } from '@melodicdev/core/devtools';

setDevMode(false); // force off
setDevMode(null);  // back to detection
isDevMode();
```

The prebuilt `bundle/melodic-core.js` is now built with dev mode ON and
`bundle/melodic-core.min.js` with it OFF, so a CDN consumer can choose.

## Ordering

1. `devMode` is applied, and the `onError` window listeners are installed
2. `onBefore()`, awaited
3. providers run, in order
4. the root component is created and mounted
5. `IMelodicApp` is bound (and `app.http` populated when `provideHttp` registered a client)
6. `onReady()`

`IMelodicApp` is bound **before** `onReady` so startup work in that hook can resolve it. If
any step throws, everything acquired so far is rolled back: window error handlers removed,
the teardowns registered by its providers run, the root element unmounted, and the
`IMelodicApp` binding released.

## The `melodic` console API

In dev mode, `bootstrap()` installs `window.melodic`. Without `bootstrap()`, call
`installConsoleApi()` from `@melodicdev/core/devtools`; it does nothing outside dev mode.

| Call | Answers |
|---|---|
| `melodic.components()` | every registered selector |
| `melodic.instances('my-card')` | mounted instances, searching shadow roots |
| `melodic.inspect($0)` | an element's selector, reactive props, signal fields, render state |
| `melodic.bindings()` | injector contents (token, type, singleton, resolved) |
| `melodic.trace()` | log every framework event until the returned function is called |
| `melodic.on(type, fn)` | subscribe to one event type |

Events cover component define/connect/render/disconnect/destroy, signal
create/set/destroy, computed recompute, effect runs, flush start/end, navigation, store
dispatches. Nothing is recorded until something subscribes.

`melodic.on()` and `melodic.trace()` read from the in-page hook,
`window.__MELODIC_DEVTOOLS_HOOK__`. `getHook()` from `@melodicdev/core/devtools` returns it
(or `null` outside dev mode), for tooling that subscribes from code:

```typescript
import { getHook } from '@melodicdev/core/devtools';

const stop = getHook()?.on('store:dispatch', (event) => console.log(event.payload));
```
