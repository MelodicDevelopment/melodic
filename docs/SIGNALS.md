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

`batch()` returns whatever its callback returns. Reads inside a batch still see the latest values immediately — including computed reads, which recompute from the already-written sources — only *notifications* and effect runs are deferred.

### Scheduling guarantees

Every write is two-phase. First the written signal **invalidates** its dependents synchronously: computeds are marked dirty and effects are queued. Only once that marking is complete does anything **execute** — immediately for a write outside a batch, at the end of the outermost batch otherwise. Consequences you can rely on:

- **No glitches.** An effect that reads two computeds derived from the same source never observes one updated and the other stale, whether or not the write happened inside a batch.
- **Failures are isolated.** If a subscriber or effect throws, every other queued subscriber and effect still runs; the error (or an `AggregateError` when several threw) is rethrown to the writer afterwards.
- **Loops are bounded.** An effect that keeps writing a signal it reads is stopped after 100 re-runs in one flush with a "Circular dependency" error, inside a batch or not.
- **Destroy wins.** An effect destroyed while queued does not run.

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

## Effects

`effect()` runs a function immediately and again whenever a signal it read changes.

```typescript
import { effect, signal } from '@melodicdev/core';

const unread = signal(0);

const ref = effect(() => {
	document.title = `${unread()} unread`;
});

unread.set(3); // title updates

ref.destroy(); // stop
```

Returning a function registers a cleanup, run before each re-run and once on destroy:

```typescript
effect(() => {
	const id = setInterval(poll, interval());
	return () => clearInterval(id);
});
```

Created inside a component — a field initializer, `onInit`, `onCreate` — the effect is
destroyed with that component, so there is nothing to tear down by hand. Elsewhere the
caller owns it.

Options: `{ name }` labels it in error messages and DevTools; `{ manual: true }` skips the
immediate first run.

`SignalEffect` remains available as the lower-level primitive `effect()` is built on.

### untracked()

Read a signal without subscribing the surrounding effect, computed or component render:

```typescript
import { untracked } from '@melodicdev/core';

effect(() => {
	// re-runs when `query` changes, but not when `page` does
	search(query(), untracked(() => page()));
});
```

## Using Signals in Components

**Every signal read while the template runs re-renders the component** — a signal on an
injected service, a signal inside an object or array, a computed from anywhere:

```typescript
@MelodicComponent({
	selector: 'user-badge',
	template: (self) => html`<span>${self.auth.user()?.name}</span>`
})
export class UserBadgeComponent {
	@Service(AuthService) auth!: AuthService; // auth.user is a signal
}
```

Signals held in component *fields* are additionally subscribed directly, which covers
reads that happen outside the template.

Lifecycle hooks (`onInit`, `onCreate`, `onRender`, …) are deliberately **not** tracked:
reads there belong to your code, not to the render.

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

Pass `{ name }` to `signal()` or `computed()` to have that name appear in the error:

```typescript
const total = computed(() => items().length, { name: 'total' });
// "Computed signal 'total' accessed after destruction. …"
```

## Creating derived state during a render

`computed()` called while a component is rendering creates a **new** computed on every
render, and each one lives until the component unmounts. Dev mode warns about it. Create
derived state in a field initializer or `onInit`:

```typescript
export class CartComponent {
	items = signal<Item[]>([]);
	total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0)); // ✅
}
```

`store.select(key, fn, cacheKey)` is the exception — it is render-scoped by design and
sweeps entries a render stops using.
