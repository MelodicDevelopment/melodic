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
