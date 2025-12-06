# Flexible Injection System

A dependency injection system that supports multiple binding types and token types.

## Quick Start

```typescript
import { Injector, GlobalInjector, Injectable, Inject } from 'melodic/injection';

// Register services
GlobalInjector.bind(UserService);
GlobalInjector.bindValue('API_URL', 'https://api.example.com');
GlobalInjector.bindFactory(DbConnection, () => new DbConnection(config));

// Get services
const userService = GlobalInjector.get(UserService);
const apiUrl = GlobalInjector.get<string>('API_URL');
```

## Token Types

Tokens identify dependencies in the container. Three types are supported:

### String Tokens

```typescript
injector.bindValue('API_URL', 'https://api.example.com');
injector.bindValue('MAX_RETRIES', 3);

const url = injector.get<string>('API_URL');
```

### Symbol Tokens

Unique tokens that can't collide:

```typescript
const CONFIG = Symbol('CONFIG');
injector.bindValue(CONFIG, { debug: true });

const config = injector.get(CONFIG);
```

### Class Tokens

Use the class itself as the token:

```typescript
injector.bind(UserService);

const userService = injector.get(UserService);
```

### Interface Tokens

Since TypeScript interfaces don't exist at runtime, use `createToken()`:

```typescript
import { createToken } from 'melodic/injection';

interface ILogger {
  log(message: string): void;
}

const LOGGER = createToken<ILogger>('ILogger');

injector.bind(LOGGER, ConsoleLogger);

// Inject with type safety
constructor(@Inject(LOGGER) private logger: ILogger) { }
```

## Binding Types

### Class Binding

Register a class to be instantiated when requested:

```typescript
// Class as its own token
injector.bind(UserService);

// Custom token with class implementation
injector.bind('IUserService', UserService);
injector.bind(LOGGER, ConsoleLogger);

// With options
injector.bind(UserService, { singleton: false });
injector.bind(RequestService, {
  singleton: false,
  args: [someConfig]
});
```

### Value Binding

Register a literal value (always singleton):

```typescript
// Primitives
injector.bindValue('API_URL', 'https://api.example.com');
injector.bindValue('MAX_RETRIES', 3);

// Objects
injector.bindValue('CONFIG', {
  debug: true,
  version: '1.0.0'
});

// Pre-created instances
const httpClient = new HttpClient({ baseURL: '/api' });
injector.bindValue(HttpClient, httpClient);
```

### Factory Binding

Register a function that creates the value:

```typescript
// Singleton factory (default) - called once
injector.bindFactory(DbConnection, () => {
  return new DbConnection({
    host: process.env.DB_HOST,
    credentials: loadCredentials()
  });
});

// Non-singleton - new value each call
injector.bindFactory('RequestId', () => crypto.randomUUID(), {
  singleton: false
});
```

## Decorators

### @Injectable

Register a class with the global injector:

```typescript
// Basic - singleton, class as token
@Injectable()
class UserService {
  getUser(id: number) { ... }
}

// Custom token
@Injectable({ token: 'IUserService' })
class UserServiceImpl implements IUserService { }

// Non-singleton
@Injectable({ singleton: false })
class RequestContext { }
```

### @Inject

Inject dependencies via constructor parameters:

```typescript
@Injectable()
class OrderService {
  constructor(
    @Inject(UserService) private users: UserService,
    @Inject('ILogger') private logger: ILogger,
    @Inject(CONFIG) private config: AppConfig
  ) { }
}
```

### @Service

Property-based lazy injection (resolved on first access):

```typescript
class MyComponent {
  @Service(UserService)
  private userService!: UserService;

  @Service('ILogger')
  private logger!: ILogger;

  doSomething() {
    this.userService.getUser(1);
  }
}
```

## Provider Syntax

Declarative registration using provider objects:

```typescript
const providers = [
  // Class shorthand
  UserService,

  // Class with custom token
  { provide: 'ILogger', useClass: ConsoleLogger },

  // Value
  { provide: 'API_URL', useValue: 'https://api.example.com' },

  // Factory
  { provide: DbConnection, useFactory: () => createDbConnection() }
];

for (const provider of providers) {
  injector.register(provider);
}
```

## API Reference

### Injector

```typescript
class Injector {
  // Bind a class
  bind<T>(cls: INewable<T>, options?: ClassBindingOptions): Binding<T>;
  bind<T>(token: Token<T>, cls: INewable<T>, options?: ClassBindingOptions): Binding<T>;

  // Bind a value
  bindValue<T>(token: Token<T>, value: T): Binding<T>;

  // Bind a factory
  bindFactory<T>(token: Token<T>, factory: () => T, options?: FactoryBindingOptions): Binding<T>;

  // Register a provider
  register<T>(provider: Provider<T>): Binding<T>;

  // Get a dependency
  get<T>(token: Token<T>): T;

  // Check if registered
  has<T>(token: Token<T>): boolean;

  // Get binding metadata
  getBinding<T>(token: Token<T>): Binding<T> | undefined;

  // Remove a binding
  unbind<T>(token: Token<T>): boolean;

  // Clear all bindings
  clear(): void;
}
```

### Binding

```typescript
class Binding<T> {
  // Properties
  key: string;
  token: Token<T>;
  type: 'class' | 'value' | 'factory';
  isSingleton: boolean;
  isResolved: boolean;

  // Configuration (chainable)
  setSingleton(value: boolean): this;
  withDependencies(deps: string[]): this;
  withArgs(args: unknown[]): this;

  // Instance management
  getInstance(): T | undefined;
  setInstance(instance: T): void;
  clearInstance(): void;
}
```

### Options

```typescript
interface ClassBindingOptions {
  singleton?: boolean;      // Default: true
  dependencies?: string[];  // Dependency token keys
  args?: unknown[];         // Extra constructor args
}

interface FactoryBindingOptions {
  singleton?: boolean;      // Default: true
}
```

## Complete Example

```typescript
import {
  GlobalInjector,
  Injectable,
  Inject,
  createToken
} from 'melodic/injection';

// Create tokens for interfaces
const LOGGER = createToken<ILogger>('ILogger');
const CONFIG = createToken<AppConfig>('AppConfig');

// Interfaces
interface ILogger {
  log(message: string): void;
}

interface AppConfig {
  apiUrl: string;
  debug: boolean;
}

// Implementations
@Injectable({ token: LOGGER })
class ConsoleLogger implements ILogger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

@Injectable()
class ApiService {
  constructor(
    @Inject(LOGGER) private logger: ILogger,
    @Inject(CONFIG) private config: AppConfig
  ) { }

  async fetch(endpoint: string) {
    this.logger.log(`Fetching ${endpoint}`);
    return fetch(`${this.config.apiUrl}${endpoint}`);
  }
}

@Injectable()
class UserService {
  constructor(@Inject(ApiService) private api: ApiService) { }

  getUser(id: number) {
    return this.api.fetch(`/users/${id}`);
  }
}

// Bootstrap
GlobalInjector.bindValue(CONFIG, {
  apiUrl: import.meta.env.VITE_API_URL,
  debug: import.meta.env.DEV
});

// Import services to trigger @Injectable decorators
import './services/logger';
import './services/api';
import './services/user';

// Use
const userService = GlobalInjector.get(UserService);
await userService.getUser(1);
```

## Comparison to Previous System

| Feature | Old System | New System |
|---------|-----------|------------|
| Token types | String, Class | String, Symbol, Class |
| Value binding | Workaround needed | `bindValue()` |
| Factory binding | Not supported | `bindFactory()` |
| Singleton control | Via decorator | Via options or chaining |
| Interface tokens | String only | `createToken<T>()` |
