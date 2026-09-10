# App Bootstrap

Melodic includes a small bootstrap helper that wires up providers, global error handling, and (optionally) mounts a root component.

## Table of Contents

- [Overview](#overview)
- [Basic Usage](#basic-usage)
- [Config Options](#config-options)
- [Providers](#providers)
- [App Instance](#app-instance)

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
	target: '#app',
	devMode: true
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
- `devMode`: enables bootstrap logging when `true`
- `onError`: global error handler for `error` and `unhandledrejection`
- `onBefore`: async hook invoked before providers are registered
- `onReady`: hook invoked once bootstrap completes
- `rootComponent`: custom element tag name to mount
- `target`: CSS selector or `HTMLElement` to append the root element to

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

Custom provider example:

```typescript
import { bootstrap, Injector } from '@melodicdev/core';

const provideFlags = () => (injector: typeof Injector) => {
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

The prebuilt `bundle/melodic-core.js` is now built with dev mode ON and
`bundle/melodic-core.min.js` with it OFF, so a CDN consumer can choose.

## Ordering

1. `onBefore()`
2. providers run, in order
3. the root component is created and mounted
4. `IMelodicApp` is bound (and `app.http` populated when `provideHttp` registered a client)
5. `onReady()`

`IMelodicApp` is bound **before** `onReady` so startup work in that hook can resolve it. If
any step throws, everything acquired so far is rolled back: window error handlers removed,
the root element unmounted, and the `IMelodicApp` binding released.

## The `melodic` console API

In dev mode, `bootstrap()` installs `window.melodic`:

| Call | Answers |
|---|---|
| `melodic.components()` | every registered selector |
| `melodic.instances('my-card')` | mounted instances, searching shadow roots |
| `melodic.inspect($0)` | an element's selector, reactive props, signal fields, render state |
| `melodic.bindings()` | injector contents (token, type, singleton, resolved) |
| `melodic.trace()` | log every framework event until the returned function is called |
| `melodic.on(type, fn)` | subscribe to one event type |

Events cover component define/create/connect/render/disconnect/destroy, signal
create/set/destroy, computed recompute, effect runs, flush start/end, navigation, store
dispatches. Nothing is recorded until something subscribes.
