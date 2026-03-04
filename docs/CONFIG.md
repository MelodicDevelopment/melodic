# Configuration

Melodic includes a lightweight configuration module for managing environment-aware application settings. Values are defined once, merged per environment at import time, and made available through dependency injection.

## Table of Contents

- [Overview](#overview)
- [Defining Configuration](#defining-configuration)
- [Environment Detection](#environment-detection)
- [Providing Configuration](#providing-configuration)
- [Consuming Configuration](#consuming-configuration)
- [Extending Configuration](#extending-configuration)
- [CLI Scaffolding](#cli-scaffolding)

## Overview

```typescript
import { defineConfig } from '@melodicdev/core/config';

export const appConfig = defineConfig({
	base: {
		appName: 'My App',
		apiBaseURL: '/api',
	},
	prod: {
		apiBaseURL: 'https://api.example.com',
	},
});
```

`defineConfig` merges `base` with the overrides for the current environment, returning a plain object you can use directly or provide to the injector.

## Defining Configuration

`defineConfig<T>` accepts a `ConfigDefinition<T>` object with a required `base` and optional `dev`, `qa`, and `prod` overrides. Each override is `Partial<T>` and is shallow-merged onto `base`.

```typescript
import { defineConfig } from '@melodicdev/core/config';

export const appConfig = defineConfig({
	base: {
		appName: 'My App',
		apiBaseURL: '/data',
		featureFlags: { newDashboard: false },
	},
	qa: {
		apiBaseURL: 'https://qa-api.example.com',
	},
	prod: {
		apiBaseURL: 'https://api.example.com',
		featureFlags: { newDashboard: true },
	},
});

export type AppConfig = typeof appConfig;
```

The returned value is resolved at import time — no runtime lookup on each access.

## Environment Detection

The `getEnvironment()` function determines the current environment using Vite's `import.meta.env`:

1. If `VITE_ENV` is `'dev'`, `'qa'`, or `'prod'`, that value is used
2. Otherwise, if `import.meta.env.PROD` is `true`, returns `'prod'`
3. Falls back to `'dev'`

Set the environment in your `.env` files or Vite config:

```
# .env.qa
VITE_ENV=qa
```

You can also import the resolved environment directly:

```typescript
import { environment } from '@melodicdev/core/config';

console.log(environment); // 'dev' | 'qa' | 'prod'
```

The `Environment` type is exported for use in your own code:

```typescript
import type { Environment } from '@melodicdev/core/config';
```

## Providing Configuration

Use `provideConfig` to register your config with the dependency injector during bootstrap:

```typescript
import { bootstrap } from '@melodicdev/core/bootstrap';
import { provideConfig } from '@melodicdev/core/config';
import { appConfig } from './config/app.config';

await bootstrap({
	target: '#app',
	rootComponent: 'app-root',
	providers: [provideConfig(appConfig)],
});
```

This binds the config object to the `APP_CONFIG` injection token as a singleton value.

## Consuming Configuration

### Direct import

Since `defineConfig` returns a plain object resolved at import time, you can import and use it directly anywhere:

```typescript
import { appConfig } from './config/app.config';

console.log(appConfig.apiBaseURL);
```

### Via dependency injection

Retrieve the config from the injector using the `APP_CONFIG` token:

```typescript
import { Injector } from '@melodicdev/core/injection';
import { APP_CONFIG } from '@melodicdev/core/config';
import type { AppConfig } from './config/app.config';

const config = Injector.get(APP_CONFIG) as AppConfig;
```

Or from the app instance returned by `bootstrap()`:

```typescript
const app = await bootstrap({ /* ... */ });
const config = app.get(APP_CONFIG) as AppConfig;
```

### Passing to other providers

Config values can feed into other providers like `provideHttp`:

```typescript
import { provideConfig } from '@melodicdev/core/config';
import { provideHttp } from '@melodicdev/core/http';
import { appConfig } from './config/app.config';

await bootstrap({
	providers: [
		provideConfig(appConfig),
		provideHttp({ baseURL: appConfig.apiBaseURL }),
	],
});
```

## Extending Configuration

In monorepo setups you often want a shared base config in a library that individual apps can override and extend. `defineConfig` supports an optional `extends` field for this purpose.

The `extends` field accepts the resolved output of another `defineConfig` call. The parent and child configs are **deep-merged** — nested objects merge recursively, while arrays and primitives are replaced by the child value.

```typescript
// libs/config/shared.config.ts
import { defineConfig } from '@melodicdev/core/config';

export const sharedConfig = defineConfig({
	base: {
		appName: 'Default',
		apiBaseURL: '/api',
		features: { analytics: true, logging: true },
	},
	prod: {
		apiBaseURL: 'https://api.example.com',
	},
});
```

```typescript
// apps/dashboard/config/app.config.ts
import { defineConfig } from '@melodicdev/core/config';
import { sharedConfig } from '@my-org/config';

export const appConfig = defineConfig({
	extends: sharedConfig,
	base: {
		appName: 'Dashboard',
		dashboardRefreshMs: 30000,
		features: { dashboard: true },
	},
	prod: {
		dashboardRefreshMs: 60000,
	},
});

// In dev → { appName: 'Dashboard', apiBaseURL: '/api', dashboardRefreshMs: 30000,
//            features: { analytics: true, logging: true, dashboard: true } }
```

### Merge behavior

| Value type | Behavior |
|------------|----------|
| Nested objects | Recursively merged — parent keys are preserved unless overridden |
| Arrays | Replaced entirely by the child value |
| Primitives | Replaced by the child value |

### Chaining

Configs can extend configs that themselves extend other configs:

```typescript
const orgConfig = defineConfig({ base: { orgName: 'Acme' } });

const sharedConfig = defineConfig({
	extends: orgConfig,
	base: { appName: 'Shared', theme: { primary: 'blue' } },
});

const appConfig = defineConfig({
	extends: sharedConfig,
	base: { appName: 'Dashboard', theme: { primary: 'purple' } },
});

// → { orgName: 'Acme', appName: 'Dashboard', theme: { primary: 'purple' } }
```

Environment overrides (`dev`, `qa`, `prod`) are applied to the child's `base` before merging with the parent, so per-app environment tuning works as expected.

## CLI Scaffolding

The CLI can scaffold a config setup for your project:

```bash
melodic add config
```

**Single app projects** get `src/config/app.config.ts` created.

**Monorepo projects** (with `workspaces` in `package.json`) get a full `libs/config/` library with path aliases and tsconfig references wired automatically.

New projects created with `melodic init` include config scaffolding out of the box. In a monorepo, `melodic add app` will automatically wire the new app to use `libs/config/` if it exists.
