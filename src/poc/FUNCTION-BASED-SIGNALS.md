# Function-Based Signals (Angular/Solid.js Style)

This is an alternative implementation of signals that allows you to call them like functions instead of using `.value`.

## Files

- **`signal-function-based.class.ts`** - Core implementation
- **`counter-function-based.component.ts`** - Example component
- **`counter-function-based.template.ts`** - Example template showing cleaner syntax
- **`signal-comparison-example.ts`** - Side-by-side comparison of both styles

## The Difference

### Property-Based (Current POC)

```typescript
// Component
count = signal(0);
doubled = computed(() => this.count.value * 2);

// Update
this.count.value++;

// Template
html`<div>Count: ${component.count.value}</div>`
```

### Function-Based (This Implementation)

```typescript
// Component
count = signal(0);
doubled = computed(() => this.count() * 2);

// Update
this.count.update(v => v + 1);
// or
this.count.set(this.count() + 1);

// Template
html`<div>Count: ${component.count()}</div>`  // Cleaner!
```

## API Reference

### Creating a Signal

```typescript
const count = signal(0);
const name = signal('John');
const items = signal<string[]>([]);
```

### Reading a Signal

```typescript
// Call it like a function
const value = count();
const currentName = name();
```

### Updating a Signal

```typescript
// Set a new value
count.set(5);
name.set('Jane');

// Update based on current value
count.update(current => current + 1);
items.update(current => [...current, 'new item']);
```

### Computed Signals

```typescript
const count = signal(0);
const doubled = computed(() => count() * 2);

// Read computed value
console.log(doubled());  // 0

// Changing count automatically updates doubled
count.set(5);
console.log(doubled());  // 10
```

### Multiple Dependencies

```typescript
const firstName = signal('John');
const lastName = signal('Doe');
const age = signal(30);

const profile = computed(() =>
  `${firstName()} ${lastName()}, age ${age()}`
);

console.log(profile());  // "John Doe, age 30"

firstName.set('Jane');
console.log(profile());  // "Jane Doe, age 30"
```

### Subscribing to Changes

```typescript
const count = signal(0);

const cleanup = count.subscribe((value) => {
  console.log('Count changed to:', value);
});

count.set(5);  // Logs: "Count changed to: 5"

// Clean up when done
cleanup();
```

## In Templates

The main benefit is **cleaner template syntax**:

```typescript
export function myTemplate(component: MyComponent) {
  return html`
    <div>
      <!-- Property-based: verbose -->
      <p>Count: ${component.count.value}</p>
      <p>Doubled: ${component.doubled.value}</p>

      <!-- Function-based: cleaner -->
      <p>Count: ${component.count()}</p>
      <p>Doubled: ${component.doubled()}</p>
    </div>
  `;
}
```

## Comparison with Property-Based

| Aspect | Property-Based (.value) | Function-Based () |
|--------|------------------------|-------------------|
| **Read syntax** | `count.value` | `count()` |
| **Template syntax** | `${count.value}` | `${count()}` ⭐ |
| **Write syntax** | `count.value = 5` | `count.set(5)` |
| **Update syntax** | `count.update(v => v + 1)` | `count.update(v => v + 1)` |
| **Accidental mutation** | Easy: `count = x` | Harder (can't reassign) ⭐ |
| **Familiar to** | Vue, Svelte | Angular, Solid.js ⭐ |
| **Property assignment** | ✅ Yes | ❌ No |
| **Cleaner templates** | ❌ No | ✅ Yes ⭐ |

## Pros of Function-Based

✅ **Cleaner templates** - `count()` vs `count.value`
✅ **Matches Angular Signals** - familiar to Angular developers
✅ **Harder to accidentally mutate** - can't do `count = newSignal`
✅ **Clear read/write distinction** - `count()` reads, `count.set()` writes
✅ **Consistent computed syntax** - `doubled()` looks like `count()`

## Cons of Function-Based

❌ **No property assignment** - must use `.set()` or `.update()`
❌ **Always need parentheses** - `count()` vs `count.value`
❌ **Different from Vue/Svelte** - those use `.value`

## Integration with ComponentBase

The function-based signals work with the same ComponentBase integration:

```typescript
private observe(): void {
  const properties = Object.getOwnPropertyNames(this._component);

  for (const prop of properties) {
    const value = (this._component as any)[prop];

    // Detect function-based signals by checking for .set method
    if (typeof value === 'function' && 'set' in value) {
      this.subscribeToSignal(value);
      continue;
    }

    // Rest of observe logic...
  }
}

protected subscribeToSignal<T>(signal: SignalGetter<T>): void {
  const cleanup = signal.subscribe(() => this.render());
  this._signalCleanups.push(cleanup);
}
```

## Migration Path

If you want to switch from property-based to function-based:

### Before
```typescript
export class MyComponent {
  count = signal(0);

  increment() {
    this.count.value++;
  }
}

// Template
html`<div>${component.count.value}</div>`
```

### After
```typescript
export class MyComponent {
  count = signal(0);

  increment() {
    this.count.update(v => v + 1);
  }
}

// Template
html`<div>${component.count()}</div>`
```

## Recommendation

**Use function-based signals if:**
- You want cleaner template syntax
- You're familiar with Angular or Solid.js
- You want to prevent accidental mutations
- You prefer explicit `.set()` calls

**Use property-based signals if:**
- You want property assignment (`count.value = 5`)
- You're familiar with Vue or Svelte
- You prefer shorter update syntax

Both implementations have the same performance and capabilities. It's purely a syntax preference!
