# Signals

Signals are Melodic's fine-grained reactive primitives. They store a value, notify subscribers, and integrate directly with components and templates.

## Table of Contents

- [Overview](#overview)
- [Creating Signals](#creating-signals)
- [Reading and Updating](#reading-and-updating)
- [Computed Signals](#computed-signals)
- [Signal Effects](#signal-effects)
- [Using Signals in Components](#using-signals-in-components)

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
