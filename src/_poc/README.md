# Signal System POC for Melodic Framework

This folder contains a proof-of-concept implementation of a reactive signal system for the Melodic framework.

## Overview

Signals provide fine-grained reactivity that integrates seamlessly with Melodic's existing component system. They offer:

- ✅ **Automatic re-rendering** when signal values change
- ✅ **Computed signals** that automatically track dependencies
- ✅ **Memory leak prevention** via automatic cleanup on component destroy
- ✅ **Shared state** across components via services
- ✅ **Backwards compatible** with existing property reactivity

## Files in This POC

### Core Implementation

- **`signal.class.ts`** - Main signal implementation
  - `Signal<T>` class for reactive values
  - `signal(initialValue)` - Factory function to create signals
  - `computed(computation)` - Creates derived signals with automatic dependency tracking
  - Automatic cleanup via `destroy()` method

### Framework Integration

- **`component-base.class.ts`** - Modified ComponentBase showing integration points
  - `_signalCleanups` array to track signal subscriptions
  - `subscribeToSignal()` method for manual subscriptions
  - Auto-detection of Signal properties in `observe()`
  - Automatic cleanup in `disconnectedCallback()`

### Examples

#### 1. Counter Component (Simple Signals)
- **`counter.component.ts`** - Component using signals for local state
- **`counter.template.ts`** - Template showing signal value access

Demonstrates:
- Basic signal usage with `.value` getter/setter
- Computed signals that derive from other signals
- Multiple computed dependencies
- Mix of signals and regular reactive properties

#### 2. Shared State (Cross-Component)
- **`app-state.service.ts`** - Service with shared signals
- **`theme-toggle.component.ts`** - Component using shared service
- **`theme-toggle.template.ts`** - Template with shared state

Demonstrates:
- Signals in services for global state
- Multiple components sharing the same signals
- Automatic re-render when other components modify signals
- Complex state management (theme, user, notifications)

## How It Works

### 1. Creating Signals

```typescript
import { signal, computed } from './signal.class';

// Simple signal
const count = signal(0);

// Computed signal (auto-updates when count changes)
const doubled = computed(() => count.value * 2);
```

### 2. Using in Components

```typescript
export class MyComponent {
  // Signals are auto-detected and subscribed
  count = signal(0);
  doubled = computed(() => this.count.value * 2);

  increment = () => {
    this.count.value++; // Triggers re-render
  };
}
```

### 3. Accessing in Templates

```typescript
export function myTemplate(component: MyComponent) {
  return html`
    <p>Count: ${component.count.value}</p>
    <p>Doubled: ${component.doubled.value}</p>
    <button @click=${component.increment}>Increment</button>
  `;
}
```

### 4. Shared State via Services

```typescript
export class AppState {
  theme = signal<'light' | 'dark'>('light');
  isDarkMode = computed(() => this.theme.value === 'dark');
}

export class MyComponent {
  @Service(AppState) appState!: AppState;
}

// In template:
html`<div class=${component.appState.isDarkMode.value ? 'dark' : 'light'}>`;
```

## Key Integration Points

### In ComponentBase

The modified `ComponentBase` has these additions:

1. **Signal Detection** (in `observe()` method):
```typescript
if (value instanceof Signal) {
  this.subscribeToSignal(value);
  continue; // Don't wrap signals
}
```

2. **Subscription Management**:
```typescript
protected subscribeToSignal<T>(signal: Signal<T>, callback?: (value: T) => void): void {
  const cleanup = signal.subscribe(callback ?? (() => this.render()));
  this._signalCleanups.push(cleanup);
}
```

3. **Automatic Cleanup** (in `disconnectedCallback()`):
```typescript
this._signalCleanups.forEach((cleanup) => cleanup());
this._signalCleanups = [];
```

## Memory Leak Prevention

Signals prevent memory leaks through multiple mechanisms:

1. **Component-level cleanup**: When a component is destroyed, all signal subscriptions are removed
2. **Signal.destroy()**: Manually clear all subscribers from a signal
3. **Computed cleanup**: Computed signals clean up their dependency tracking when destroyed
4. **Automatic unsubscribe**: `subscribe()` returns a cleanup function

```typescript
// Manual subscription example
onInit() {
  // This will be auto-cleaned when component destroys
  this.subscribeToSignal(mySignal, (value) => {
    console.log('Signal changed:', value);
  });
}
```

## Computed Signals Deep Dive

Computed signals use a clever dependency tracking system:

1. **Global effect tracking**: When a computed runs, it sets a global `activeEffect`
2. **Automatic dependency collection**: Any signal accessed during computation is tracked
3. **Auto-recomputation**: When dependencies change, the computed re-runs
4. **Efficient updates**: Only recomputes when dependencies actually change

```typescript
const firstName = signal('John');
const lastName = signal('Doe');

// Automatically tracks firstName and lastName
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

firstName.value = 'Jane'; // fullName automatically updates to "Jane Doe"
```

### Can a computed signal handle multiple dependencies?

**Yes, absolutely!** The `dependencies` property is a `Set<Signal<any>>`, which can track any number of signals. Every signal accessed during the computation automatically adds itself to the dependencies set.

**How it works:**

When you create a computed signal with multiple dependencies:

```typescript
const firstName = signal('John');
const lastName = signal('Doe');
const age = signal(30);
const title = signal('Dr.');

// This computed depends on FOUR signals
const profile = computed(() =>
  `${title.value} ${firstName.value} ${lastName.value}, age ${age.value}`
);
```

**Step-by-step execution:**

1. `effect.run()` sets `activeEffect = effect` (global tracking enabled)
2. Computation executes and accesses `title.value` → `title` adds itself to `effect.dependencies`
3. Accesses `firstName.value` → `firstName` adds itself to `effect.dependencies`
4. Accesses `lastName.value` → `lastName` adds itself to `effect.dependencies`
5. Accesses `age.value` → `age` adds itself to `effect.dependencies`
6. `activeEffect = null` (global tracking disabled)

**Result:** `effect.dependencies = Set { title, firstName, lastName, age }`

Now when **any** of these signals changes, the computed recalculates:

```typescript
firstName.value = 'Jane';  // profile recalculates!
lastName.value = 'Smith';  // profile recalculates!
title.value = 'Prof.';     // profile recalculates!
age.value = 35;            // profile recalculates!
```

### Dynamic Dependencies

The really powerful feature is that dependencies can **change** between runs based on conditional logic:

```typescript
const showDetails = signal(true);
const firstName = signal('John');
const lastName = signal('Doe');
const username = signal('jdoe');

const display = computed(() => {
  if (showDetails.value) {
    // Dependencies: [showDetails, firstName, lastName]
    return `${firstName.value} ${lastName.value}`;
  } else {
    // Dependencies: [showDetails, username]
    return username.value;
  }
});
```

**When `showDetails = true`:**
- Dependencies: `[showDetails, firstName, lastName]`
- Changing `username` does **nothing** (not a dependency)

**When `showDetails = false`:**
- Dependencies: `[showDetails, username]`
- Changing `firstName` or `lastName` does **nothing** (not dependencies anymore!)

This works because the `Effect.run()` method clears old dependencies and re-tracks new ones on every computation:

```typescript
run(): void {
  // Clear old dependencies
  this.dependencies.forEach((signal) => {
    signal['_subscribers'].delete(this.execute);
  });
  this.dependencies.clear();

  // Track new dependencies (may be different based on logic!)
  activeEffect = this;
  this.execute();
  activeEffect = prevEffect;
}
```

### The `activeEffect` Global Explained

The `activeEffect` global variable is the key to automatic dependency tracking. It's a pointer to the "currently running computation" that enables signals to detect when they're being accessed inside a computed signal.

**Why use a global?**

It enables **implicit context passing** - signals can detect their usage context without you manually specifying dependencies:

```typescript
// Without activeEffect (manual dependencies - tedious!)
const fullName = computed([firstName, lastName], () =>
  `${firstName.value} ${lastName.value}`
);

// With activeEffect (automatic - just works!)
const fullName = computed(() =>
  `${firstName.value} ${lastName.value}`
);
```

**How it works:**

1. When `computed()` is created, it creates an `Effect` object
2. `effect.run()` sets `activeEffect = this` (the global is now set)
3. The computation executes: `firstName.value`
4. The `Signal.value` getter sees `activeEffect` is set
5. Adds itself to `activeEffect.dependencies`
6. After computation completes, `activeEffect = null` (cleared)

This pattern is inspired by reactive frameworks like **Solid.js**, **Vue 3**, and **Preact Signals**.

**Important limitation:** Async computations don't work because `activeEffect` is cleared before async operations complete:

```typescript
// ❌ Won't track dependencies correctly
const data = computed(async () => {
  await delay(100);
  return count.value; // activeEffect already null!
});
```

See `multi-dependency-example.ts` for 6 comprehensive examples demonstrating multiple dependencies, dynamic dependencies, nested computed signals, and complex business logic scenarios.

## Advantages Over Current System

### Current System (Property Observation)
- ✅ Simple and effective
- ❌ No computed properties (requires manual getters)
- ❌ Hard to share state across components
- ❌ No fine-grained subscriptions

### Signal System
- ✅ All advantages of current system
- ✅ Computed values with automatic dependency tracking
- ✅ Easy cross-component state management
- ✅ Opt-in: use signals where needed, regular properties elsewhere
- ✅ No breaking changes to existing code

## Integration Checklist

To integrate this POC into the main framework:

- [ ] Move `signal.class.ts` to `src/signals/`
- [ ] Merge changes from POC `component-base.class.ts` into actual `component-base.class.ts`
- [ ] Export signal functions from `src/index.ts`:
  ```typescript
  export { Signal, signal, computed } from './signals/signal.class';
  ```
- [ ] Update TypeScript to recognize Signal properties
- [ ] Add signal examples to documentation
- [ ] Consider adding to examples folder

## Performance Considerations

- **Signals are lazy**: Computed signals only recalculate when accessed
- **Change detection**: Uses `===` comparison to avoid unnecessary updates
- **Minimal overhead**: Signal subscriptions use `Set` for O(1) add/remove
- **Memory efficient**: Only stores cleanup functions, not full subscriptions

## Next Steps

1. **Testing**: Add unit tests for signal system
2. **Documentation**: Add to framework docs
3. **Examples**: Create more real-world examples
4. **Optimization**: Consider batching updates for multiple signal changes
5. **DevTools**: Consider adding signal debugging tools

## Questions to Consider

1. Should signals be the default, or opt-in alongside property reactivity?
2. Do we need `effect()` for side-effects (like logging)?
3. Should we support async computed signals?
4. Do we want signal-based forms/validation?

## Comparison to Other Frameworks

- **Angular Signals**: Similar API with `.value` access
- **Vue Refs**: Very similar concept (`ref.value`)
- **Solid.js**: Inspiration for the dependency tracking system
- **Preact Signals**: Similar fine-grained reactivity approach
