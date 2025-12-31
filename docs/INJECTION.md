# Dependency Injection

Melodic ships with a lightweight dependency injection system that supports class bindings, value bindings, factories, and decorators.

## Table of Contents

- [Overview](#overview)
- [Injectable Services](#injectable-services)
- [Property Injection](#property-injection)
- [Constructor Injection](#constructor-injection)
- [Custom Tokens](#custom-tokens)
- [Manual Binding](#manual-binding)

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

## Property Injection

Use `@Service()` on a class property to lazily resolve a dependency.

```typescript
import { Service, MelodicComponent } from '@melodicdev/core';
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

## Custom Tokens

Use `createToken()` when you want a token that is not tied to a class constructor.

```typescript
import { createToken, Injector } from '@melodicdev/core';

const FEATURE_FLAGS = createToken<Record<string, boolean>>('FEATURE_FLAGS');

Injector.bindValue(FEATURE_FLAGS, { newNav: true });
```

## Manual Binding

You can bind classes, values, or factories directly.

```typescript
import { Injector } from '@melodicdev/core';

class Logger {
	log(message: string): void {
		console.log(message);
	}
}

Injector.bind(Logger, Logger, { singleton: true });
Injector.bindValue('ENV', 'production');
Injector.bindFactory('UUID', () => crypto.randomUUID());
```
