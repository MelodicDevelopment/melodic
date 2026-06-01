# Signals

Signals are Melodic's fine-grained reactive primitives. They store a value, notify subscribers, and integrate directly with components and templates.

## Table of Contents

- [Overview](#overview)
- [Creating Signals](#creating-signals)
- [Reading and Updating](#reading-and-updating)
- [Batching Updates](#batching-updates)
- [Computed Signals](#computed-signals)
- [Signal Effects](#signal-effects)
- [Using Signals in Components](#using-signals-in-components)
- [Destruction](#destruction)

## Overview

A signal is a function that returns its current value and exposes helpers like `set`, `update`, and `subscribe`.

```typescript
import { signal } from '@melodicdev/core';

const count = signal(0);

console.log(count()); // 0
count.set(1);
```

## Creating Signals

```typescript
import { signal } from '@melodicdev/core';

const name = signal('Ada');
const optional = signal<number>();
```

## Reading and Updating

```typescript
count.set(2);
count.update((current) => current + 1);

const unsubscribe = count.subscribe((value) => {
	console.log('Count changed:', value);
});

unsubscribe();
```

## Batching Updates

`batch()` groups multiple signal writes so dependents recompute **once** at the end instead of after every individual write. While a batch is active, notifications are deferred and de-duplicated; the flush runs when the outermost batch completes. This makes updates glitch-free — a computed or effect that depends on several signals written in the same batch runs a single time, observing all the new values together.

```typescript
import { signal, computed, batch } from '@melodicdev/core/signals';

const first = signal('Ada');
const last = signal('Lovelace');
const full = computed(() => `${first()} ${last()}`);

batch(() => {
	first.set('Grace');
	last.set('Hopper');
}); // `full` recomputes once here, not twice

batch(() => batch(() => first.set('Alan'))); // nested batches flush with the outermost
```

`batch()` returns whatever its callback returns. Reads inside a batch still see the latest values immediately; only *notifications* to subscribers are deferred.

## Computed Signals

Computed signals automatically track dependencies and re-run when dependencies change.

```typescript
import { signal, computed } from '@melodicdev/core';

const price = signal(10);
const qty = signal(2);
const total = computed(() => price() * qty());

console.log(total()); // 20
price.set(15);
console.log(total()); // 30
```

## Signal Effects

`SignalEffect` lets you run a side effect that re-executes when its dependencies change.

```typescript
import { signal, SignalEffect } from '@melodicdev/core';

const status = signal('idle');

const effect = new SignalEffect(() => {
	console.log('Status:', status());
});

effect.run();
status.set('busy');

// Cleanup
// effect.destroy();
```

## Using Signals in Components

Signals declared as component properties are automatically subscribed to by the component base class. When they update, the component re-renders.

```typescript
import { MelodicComponent, html, signal } from '@melodicdev/core';

@MelodicComponent({
	selector: 'counter-view',
	template: (self) => html`
		<button @click=${() => self.count.update((v) => v + 1)}>
			Count: ${self.count()}
		</button>
	`
})
export class CounterViewComponent {
	count = signal(0);
}
```

## Destruction

`signal.destroy()` clears subscribers and marks the signal destroyed. After that:

- `signal()`, `signal.set(...)`, `signal.update(...)`, and `signal.subscribe(...)` **throw**.
- `signal.destroy()` and `signal.unsubscribe(...)` are idempotent — safe to call any number of times.
- Unsubscribers returned before destroy can still be invoked safely.

Throwing on access after destroy is intentional. It surfaces stale-reference bugs at the access site rather than silently returning the last-known value. Most signals in a component are destroyed automatically (computeds returned by `select()`, signals owned by `AbstractControl`); if you create raw signals or computeds yourself in long-lived code, call `.destroy()` when you're done with them and don't hold the reference afterwards.

```typescript
const c = signal(0);
c.destroy();
c();          // throws
c.destroy();  // idempotent, no error
```
