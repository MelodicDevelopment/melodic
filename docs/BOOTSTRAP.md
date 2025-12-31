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
