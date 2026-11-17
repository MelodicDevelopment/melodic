# Dependency Injection

Melodic ships with a lightweight dependency injection system that supports class bindings, value bindings, factories, and decorators.

## Table of Contents

- [Overview](#overview)
- [Injectable Services](#injectable-services)
- [Property Injection](#property-injection)
- [Constructor Injection](#constructor-injection)
- [Custom Tokens](#custom-tokens)
- [Manual Binding](#manual-binding)
- [`inject()`](#inject)
- [Testing with fakes](#testing-with-fakes)
- [Re-binding](#re-binding)
- [Inspecting the container](#inspecting-the-container)
- [Provider teardown](#provider-teardown)

## Overview

The DI system is built around an `Injector` instance and the `@Injectable`, `@Service`, and `@Inject` decorators.

```typescript
import { Injector, Injectable, Service, Inject } from '@melodicdev/core';
```

## Injectable Services

Use `@Injectable()` to register a class with the injector.

```typescript
import { Injectable } from '@melodicdev/core';

@Injectable()
export class MetricsService {
	track(event: string): void {
		console.log('Track:', event);
	}
}
```

You can optionally pass configuration:

```typescript
@Injectable({
	singleton: true
})
export class ConfigService {}
```

Options:

- `singleton` — `true` (the default) creates one shared instance on first resolution; `false` creates a new instance on every resolution.
- `token` — bind the class under this token instead of the class itself.
- `dependencies` — tokens resolved and passed as constructor arguments, for classes that do not use `@Inject()`.
- `args` — extra constructor arguments, appended after the resolved dependencies.

Instances are created lazily, the first time the token is resolved.

## Property Injection

Use `@Service()` on a class property to lazily resolve a dependency. The dependency is resolved on the first read and cached for that instance.

```typescript
import { Service, MelodicComponent, html } from '@melodicdev/core';
import { MetricsService } from './metrics.service';

@MelodicComponent({
	selector: 'analytics-panel',
	template: () => html`<div>Analytics</div>`
})
export class AnalyticsPanelComponent {
	@Service(MetricsService) private metrics!: MetricsService;

	onCreate(): void {
		this.metrics.track('panel_loaded');
	}
}
```

## Constructor Injection

Use `@Inject()` on constructor parameters when you want explicit injection without `@Service`.

```typescript
import { Inject, Injectable, createToken, Injector } from '@melodicdev/core';

const API_URL = createToken<string>('API_URL');
Injector.bindValue(API_URL, 'https://api.example.com');

@Injectable()
export class ApiClient {
	constructor(@Inject(API_URL) private baseUrl: string) {}
}
```

Parameters are resolved by position, and a parameter without `@Inject()` receives
`undefined`. `@Inject()` works the same way on a component's constructor; its parameters
are resolved when the element is created.

## Custom Tokens

Use `createToken()` when you want a token that is not tied to a class constructor.

```typescript
import { createToken, Injector } from '@melodicdev/core';

const FEATURE_FLAGS = createToken<Record<string, boolean>>('FEATURE_FLAGS');

Injector.bindValue(FEATURE_FLAGS, { newNav: true });
```

A token can also be a plain string or symbol. Tokens are matched by identity: two
`createToken('x')` calls produce two different tokens, so share the token reference rather
than re-creating it.

## Manual Binding

You can bind classes, values, or factories directly.

```typescript
import { Injector } from '@melodicdev/core';

class Logger {
	log(message: string): void {
		console.log(message);
	}
}

Injector.bind(Logger, Logger, { singleton: true }); // bind(token, class, options)
Injector.bindValue('ENV', 'production');
Injector.bindFactory('UUID', () => crypto.randomUUID(), { singleton: false });
```

`Injector.bind(Logger)` is shorthand for binding a class under itself. Class and factory
bindings are singletons by default: without `{ singleton: false }` the factory above would
run once and every consumer would get the same UUID.

Resolve a binding with `Injector.get(token)`:

```typescript
const env = Injector.get<string>('ENV');
const logger = Injector.get(Logger);
```

`get()` throws `Dependency could not be found: …` when nothing is bound to the token, and
`Circular dependency detected: A -> B -> A` when classes depend on each other.
`Injector.unbind(token)` removes one binding and `Injector.clear()` removes them all.

## `inject()`

`@Service(Token) field!: T` is lazy but untyped — `@Service(HttpClient) http!: Logger`
compiles. `inject()` derives the type from the token:

```typescript
import { inject, injectOptional } from '@melodicdev/core';

const http = inject(HttpClient);          // HttpClient
const analytics = injectOptional(ANALYTICS); // Analytics | undefined
const logger = injectOptional(LOGGER, consoleLogger); // with a fallback
```

`inject()` resolves eagerly, so call it where the binding already exists: a field
initializer inside a component (bootstrap has run by then), `onInit`, or a service
constructor. `@Service` remains the lazy option.

## Testing with fakes

`@Service` fields are writable. Assigning one replaces the dependency **for that instance
only**, without touching the global injector:

```typescript
const el = await mount<UserBadgeComponent>('user-badge');
el.component.auth = fakeAuth;
```

See [TESTING.md](./TESTING.md#replacing-a-dependency).

## Re-binding

Binding a token whose singleton has already been resolved leaves every existing holder on
the old instance while new consumers get the new one. Dev mode warns about it, whichever of
`bind()`, `bindValue()` or `bindFactory()` made the replacement; call
`Injector.unbind(token)` first if the replacement is intentional.

## Inspecting the container

`Injector.entries()` returns every registered binding as `[tokenKey, binding]`, and
`Injector.has(token)` / `Injector.getBinding(token)` answer questions about one. These are
for diagnostics and DevTools (`melodic.bindings()` in the console), not for mutating the
container.

## Provider teardown

A provider that sets something up outside the container — a `window` listener, a change to
global browser state — registers its cleanup with `addTeardown`:

```typescript
import type { Provider } from '@melodicdev/core';

export const provideOnlineStatus = (): Provider => (injector) => {
	const status = signal(navigator.onLine);
	const update = () => status.set(navigator.onLine);

	window.addEventListener('online', update);
	window.addEventListener('offline', update);
	injector.bindValue(ONLINE_STATUS, status);

	injector.addTeardown(() => {
		window.removeEventListener('online', update);
		window.removeEventListener('offline', update);
	});
};
```

`bootstrap()` collects the teardowns its providers registered and runs them from
`app.destroy()`, after the root element is removed, so components tear down against live
services first. A teardown that throws is logged and the rest still run. `provideRouter()`
releases the router's window listeners this way. See [BOOTSTRAP.md](./BOOTSTRAP.md#app-instance).
