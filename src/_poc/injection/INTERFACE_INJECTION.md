# Interface-Based Injection Patterns

How to inject by interface/contract instead of concrete implementations for loose coupling and easy testing.

## The Problem

```typescript
// Tightly coupled to implementation
class MyComponent {
  @Service(TodoService) private todos!: TodoService;
}

// What if you want to swap TodoService for MockTodoService in tests?
// You'd have to change the component code!
```

## The Solution

```typescript
// Loosely coupled to interface
const TODO_SERVICE = createToken<ITodoService>('ITodoService');

class MyComponent {
  @Service(TODO_SERVICE) private todos!: ITodoService;
}

// Swap implementations without touching component code
injector.bind(TODO_SERVICE, ApiTodoService);   // Production
injector.bind(TODO_SERVICE, MockTodoService);  // Testing
```

## Pattern 1: createToken (Recommended for Interfaces)

```typescript
import { createToken, GlobalInjector, Inject } from 'melodic/injection';

// Define interface
interface ILogger {
  log(message: string): void;
  error(message: string): void;
}

// Create typed token
const LOGGER = createToken<ILogger>('ILogger');

// Implementations
class ConsoleLogger implements ILogger {
  log(message: string) { console.log(message); }
  error(message: string) { console.error(message); }
}

class MockLogger implements ILogger {
  logs: string[] = [];
  log(message: string) { this.logs.push(message); }
  error(message: string) { this.logs.push(`ERROR: ${message}`); }
}

// Register
GlobalInjector.bind(LOGGER, ConsoleLogger);

// Use
class UserService {
  constructor(@Inject(LOGGER) private logger: ILogger) { }
}

// Swap for testing
GlobalInjector.bind(LOGGER, MockLogger);
```

**Pros:**
- Full type safety
- Works with interfaces (which don't exist at runtime)
- Clean syntax with `createToken<T>()`

## Pattern 2: Abstract Classes

Abstract classes exist at runtime, so they can be used directly as tokens:

```typescript
// Define contract as abstract class
abstract class DataService {
  abstract getData(): Promise<string[]>;
  abstract saveData(data: string[]): Promise<void>;
}

// Implementations
class ApiDataService extends DataService {
  async getData() { return fetch('/api/data').then(r => r.json()); }
  async saveData(data: string[]) { await fetch('/api/data', { method: 'POST', body: JSON.stringify(data) }); }
}

class LocalStorageDataService extends DataService {
  async getData() { return JSON.parse(localStorage.getItem('data') || '[]'); }
  async saveData(data: string[]) { localStorage.setItem('data', JSON.stringify(data)); }
}

// Register - abstract class IS the token
GlobalInjector.bind(DataService, ApiDataService);

// Use
class MyComponent {
  @Service(DataService) private dataService!: DataService;
}

// Swap
GlobalInjector.bind(DataService, LocalStorageDataService);
```

**Pros:**
- No separate token needed
- Abstract class serves as both contract and token
- Full type safety

**Cons:**
- Must use abstract class instead of interface

## Pattern 3: String Tokens (Simple)

```typescript
const LOGGER_TOKEN = 'ILogger';

GlobalInjector.bind(LOGGER_TOKEN, ConsoleLogger);

class MyComponent {
  @Service(LOGGER_TOKEN) private logger!: ILogger;
}
```

**Pros:**
- Simple and straightforward
- No imports needed for token

**Cons:**
- No compile-time type checking on token
- Potential for typos

## Pattern 4: Symbol Tokens (Unique)

```typescript
const LOGGER = Symbol('ILogger');

GlobalInjector.bind(LOGGER, ConsoleLogger);

class MyComponent {
  constructor(@Inject(LOGGER) private logger: ILogger) { }
}
```

**Pros:**
- Guaranteed unique (no collisions)
- Good for large systems

**Cons:**
- Less readable in debugging

## Comparison

| Pattern | Type Safety | Runtime Token | Best For |
|---------|-------------|---------------|----------|
| `createToken<T>()` | Full | Symbol | Interfaces |
| Abstract Class | Full | Class | Class hierarchies |
| String Token | Manual | String | Simple cases |
| Symbol Token | Manual | Symbol | Large systems |

## Real-World Example

```typescript
import { createToken, GlobalInjector, Injectable, Inject } from 'melodic/injection';

// Tokens
const TODO_REPO = createToken<ITodoRepository>('ITodoRepository');
const LOGGER = createToken<ILogger>('ILogger');

// Interfaces
interface ITodoRepository {
  getAll(): Promise<Todo[]>;
  add(todo: Todo): Promise<void>;
  remove(id: number): Promise<void>;
}

interface ILogger {
  log(message: string): void;
}

// Production implementations
class ApiTodoRepository implements ITodoRepository {
  constructor(@Inject(LOGGER) private logger: ILogger) { }

  async getAll() {
    this.logger.log('Fetching todos from API');
    return fetch('/api/todos').then(r => r.json());
  }

  async add(todo: Todo) {
    await fetch('/api/todos', { method: 'POST', body: JSON.stringify(todo) });
  }

  async remove(id: number) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  }
}

class ConsoleLogger implements ILogger {
  log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

// Mock implementations for testing
class MockTodoRepository implements ITodoRepository {
  todos: Todo[] = [
    { id: 1, text: 'Test todo', completed: false }
  ];

  async getAll() { return [...this.todos]; }
  async add(todo: Todo) { this.todos.push(todo); }
  async remove(id: number) { this.todos = this.todos.filter(t => t.id !== id); }
}

class MockLogger implements ILogger {
  messages: string[] = [];
  log(message: string) { this.messages.push(message); }
}

// Production setup
function setupProduction() {
  GlobalInjector.bind(LOGGER, ConsoleLogger);
  GlobalInjector.bind(TODO_REPO, ApiTodoRepository);
}

// Test setup
function setupTesting() {
  GlobalInjector.bind(LOGGER, MockLogger);
  GlobalInjector.bind(TODO_REPO, MockTodoRepository);
}

// Component - same code works with both setups
@Injectable()
class TodoListComponent {
  constructor(@Inject(TODO_REPO) private repo: ITodoRepository) { }

  async loadTodos() {
    return this.repo.getAll();
  }
}
```

## Testing Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GlobalInjector } from 'melodic/injection';

describe('TodoListComponent', () => {
  let mockRepo: MockTodoRepository;

  beforeEach(() => {
    // Clear and setup mocks
    GlobalInjector.clear();
    mockRepo = new MockTodoRepository();
    GlobalInjector.bindValue(TODO_REPO, mockRepo);
    GlobalInjector.bind(TodoListComponent);
  });

  it('loads todos from repository', async () => {
    const component = GlobalInjector.get(TodoListComponent);
    const todos = await component.loadTodos();

    expect(todos).toHaveLength(1);
    expect(todos[0].text).toBe('Test todo');
  });

  it('works with empty repository', async () => {
    mockRepo.todos = [];

    const component = GlobalInjector.get(TodoListComponent);
    const todos = await component.loadTodos();

    expect(todos).toHaveLength(0);
  });
});
```

## Recommendation

Use **`createToken<T>()`** for interfaces and **abstract classes** for class hierarchies:

```typescript
// For interfaces
const LOGGER = createToken<ILogger>('ILogger');
const CONFIG = createToken<AppConfig>('AppConfig');

// For class hierarchies
abstract class Repository<T> { ... }
class UserRepository extends Repository<User> { ... }

// Register
injector.bind(LOGGER, ConsoleLogger);
injector.bind(Repository, UserRepository);  // If you only need one
```

This gives you:
- Full TypeScript type safety
- Easy swapping for tests
- Clean, readable code
- Runtime token support
