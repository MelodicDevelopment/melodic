# Interface-Based Injection Patterns

This guide shows you how to inject by interface/contract instead of concrete implementations, making it easy to swap out services.

## The Problem

```typescript
// ❌ Tightly coupled to implementation
export class MyComponent {
  @Service(TodoService) private todos!: TodoService;
}

// What if you want to swap TodoService for MockTodoService in tests?
// You'd have to change the component code!
```

## The Solution: Inject by Contract

```typescript
// ✅ Loosely coupled to interface
export class MyComponent {
  @Service(ITodoService) private todos!: ITodoService;
}

// Now you can swap implementations without touching component code
```

## Available Patterns

### 1. String Tokens (Simple)

```typescript
export interface ILogger {
  log(message: string): void;
}

export const LOGGER_TOKEN = 'ILogger';

class ConsoleLogger implements ILogger { ... }
class MockLogger implements ILogger { ... }

// Register
Injector.bind(LOGGER_TOKEN, ConsoleLogger).asSingleton();

// Use
export class MyComponent {
  @Service(LOGGER_TOKEN) private logger!: ILogger;
}

// Swap
Injector.bind(LOGGER_TOKEN, MockLogger).asSingleton();
```

**Pros:**
- Simple and straightforward
- Already supported by your system

**Cons:**
- No compile-time type checking on token string
- Potential for typos and collisions

---

### 2. InjectionToken Class (Angular-style)

```typescript
export class InjectionToken<T> {
  constructor(public readonly key: string) {}
  toString() { return this.key; }
}

export const LOGGER = new InjectionToken<ILogger>('ILogger');

// Register
Injector.bind(LOGGER.toString(), ConsoleLogger).asSingleton();

// Use
export class MyComponent {
  @Service(LOGGER.toString()) private logger!: ILogger;
}
```

**Pros:**
- Type-safe token definition
- Self-documenting code

**Cons:**
- Need to call `.toString()` everywhere
- Slight verbosity

---

### 3. Abstract Classes ⭐ **RECOMMENDED**

```typescript
export abstract class DataService {
  abstract getData(): Promise<string[]>;
  abstract saveData(data: string[]): Promise<void>;
}

class ApiDataService extends DataService { ... }
class LocalStorageDataService extends DataService { ... }

// Register (abstract class as token!)
Injector.bind(DataService, ApiDataService).asSingleton();

// Use
export class MyComponent {
  @Service(DataService) private dataService!: DataService;
}

// Swap
Injector.bind(DataService, LocalStorageDataService).asSingleton();
```

**Pros:**
- ✅ Abstract classes exist at runtime (unlike interfaces)
- ✅ Can use class directly as token
- ✅ Full type safety
- ✅ No string tokens needed
- ✅ Clean, readable code

**Cons:**
- Must use abstract class instead of interface

**Why this is best for Melodic:**
Abstract classes give you the best of both worlds - they act as contracts like interfaces, but exist at runtime so they can be used as tokens directly!

---

### 4. Symbol Tokens (Collision-Free)

```typescript
export const LOGGER_SYMBOL = Symbol.for('ILogger');

Injector.bind(LOGGER_SYMBOL.toString(), ConsoleLogger).asSingleton();

export class MyComponent {
  @Service(LOGGER_SYMBOL.toString()) private logger!: ILogger;
}
```

**Pros:**
- Guaranteed unique (no collisions)
- Global symbol registry with `Symbol.for()`

**Cons:**
- Need to call `.toString()`
- Less readable

---

### 5. Factory Pattern

```typescript
class NotificationServiceFactory {
  static create(): INotificationService {
    if (isProduction) return new EmailNotificationService();
    return new MockNotificationService();
  }
}

Injector.bind('INotificationService', {
  getInstance: () => NotificationServiceFactory.create()
} as any).asSingleton();
```

**Pros:**
- Complex creation logic
- Runtime environment detection

**Cons:**
- More complex setup

---

## Quick Comparison

| Pattern | Type Safety | Clean Syntax | Swap Ease | Best For |
|---------|-------------|--------------|-----------|----------|
| String Tokens | Manual | ⚠️ Fair | ⭐⭐⭐ | Quick prototypes |
| InjectionToken | ✅ Yes | ⚠️ Fair | ⭐⭐⭐ | Medium projects |
| Abstract Classes | ✅ Yes | ⭐⭐⭐ | ⭐⭐⭐ | **Most projects** |
| Symbol Tokens | Manual | ⚠️ Fair | ⭐⭐⭐ | Large systems |
| Factory | ✅ Yes | ⚠️ Fair | ⭐⭐ | Complex logic |

---

## Real-World Example

Let's build a data service that can swap between API and mock:

```typescript
// 1. Define contract as abstract class
export abstract class TodoRepository {
  abstract getAll(): Promise<Todo[]>;
  abstract add(todo: Todo): Promise<void>;
  abstract remove(id: number): Promise<void>;
}

// 2. Create implementations
export class ApiTodoRepository extends TodoRepository {
  async getAll(): Promise<Todo[]> {
    const response = await fetch('/api/todos');
    return response.json();
  }

  async add(todo: Todo): Promise<void> {
    await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(todo)
    });
  }

  async remove(id: number): Promise<void> {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  }
}

export class MockTodoRepository extends TodoRepository {
  private todos: Todo[] = [
    { id: 1, text: 'Mock todo 1', completed: false },
    { id: 2, text: 'Mock todo 2', completed: true }
  ];

  async getAll(): Promise<Todo[]> {
    return [...this.todos];
  }

  async add(todo: Todo): Promise<void> {
    this.todos.push(todo);
  }

  async remove(id: number): Promise<void> {
    this.todos = this.todos.filter(t => t.id !== id);
  }
}

// 3. Register implementation
// For development:
Injector.bind(TodoRepository, MockTodoRepository).asSingleton();

// For production:
// Injector.bind(TodoRepository, ApiTodoRepository).asSingleton();

// 4. Use in components (no changes needed when swapping!)
export class TodoListComponent {
  @Service(TodoRepository) private repo!: TodoRepository;

  async loadTodos() {
    const todos = await this.repo.getAll();
    // Component doesn't care if it's API or mock!
  }
}

// 5. For testing, easily swap:
import { test } from 'vitest';

test('loads todos', () => {
  // Swap to mock for this test
  Injector.bind(TodoRepository, MockTodoRepository).asSingleton();

  const component = new TodoListComponent();
  // Test with mock data
});
```

---

## Migration Guide

If you have existing concrete class injection:

### Before (Concrete)
```typescript
@Service(TodoService) private todos!: TodoService;
```

### After (Interface-based)
```typescript
// Option 1: Abstract class (recommended)
abstract class ITodoService { ... }
class TodoService extends ITodoService { ... }
@Service(ITodoService) private todos!: ITodoService;

// Option 2: String token
const TODO_SERVICE = 'ITodoService';
@Service(TODO_SERVICE) private todos!: ITodoService;
```

---

## Recommendation for Melodic

**Use Abstract Classes** as your primary pattern:

1. Define contracts as abstract classes (not interfaces)
2. Use the abstract class as the injection token
3. Extend the abstract class for each implementation
4. Register the concrete implementation against the abstract class

This gives you:
- ✅ Full TypeScript type safety
- ✅ No string tokens to manage
- ✅ Clean, readable code
- ✅ Easy testing (swap to mocks)
- ✅ Runtime token support (unlike interfaces)

See `interface-injection-patterns.ts` for complete working examples!
