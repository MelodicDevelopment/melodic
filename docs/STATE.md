# Signal Store (State)

Melodic includes a Redux-inspired state layer built on signals. It gives you actions, reducers, effects, and selectors with minimal boilerplate.

## Table of Contents

- [Overview](#overview)
- [Creating State](#creating-state)
- [Actions](#actions)
- [Reducers](#reducers)
- [Effects](#effects)
- [Providing the Store](#providing-the-store)
- [Using the Store in Components](#using-the-store-in-components)
- [Selectors and Lifetime](#selectors-and-lifetime)

## Overview

The store is driven by `SignalStoreService`, which reads from a signal-based state object created with `createState`.

```typescript
import { createState } from '@melodicdev/core/state';

const state = createState({
	count: 0,
	user: null as { id: string; name: string } | null
});
```

## Creating State

`createState` converts an initial object into a set of signals.

```typescript
const appState = createState({
	todos: [] as string[],
	loading: false
});
```

Each key becomes a signal: `appState.todos()` and `appState.loading()`.

## Actions

Use `createAction` and `props` to define action creators.

```typescript
import { createAction, props } from '@melodicdev/core/state';

const addTodo = createAction('[Todos] Add', props<{ text: string }>());
const loadTodos = createAction('[Todos] Load');
```

## Reducers

Use `onAction` and `createReducer` to map actions to state changes.

```typescript
import { createReducer, onAction } from '@melodicdev/core/state';

const todosReducer = createReducer(
	onAction(addTodo, (state, action) => [...state, action.payload.text])
);
```

Combine reducers by key:

```typescript
const reducers = {
	todos: todosReducer
};
```

## Effects

Effects let you respond to actions with async work and optionally dispatch follow-up actions.

```typescript
import { Injectable } from '@melodicdev/core/injection';
import type { ActionEffects } from '@melodicdev/core/state';

@Injectable()
class TodosEffects implements ActionEffects {
	getEffects() {
		return [
			{
				actions: [loadTodos],
				effect: async () => {
					const result = await fetch('/api/todos');
					const todos = await result.json();
					return addTodo({ text: todos[0].title });
				}
			}
		];
	}
}
```

## Providing the Store

Use `provideRX` during bootstrap to register state, reducers, and effects.

```typescript
import { bootstrap } from '@melodicdev/core';
import { provideRX, createState, createReducer } from '@melodicdev/core/state';

const state = createState({
	todos: [] as string[]
});

const reducers = {
	todos: createReducer(
		onAction(addTodo, (state, action) => [...state, action.payload.text])
	)
};

await bootstrap({
	providers: [provideRX(state, reducers, { todos: TodosEffects }, true)]
});
```

## Using the Store in Components

```typescript
import { MelodicComponent } from '@melodicdev/core/components';
import { Service } from '@melodicdev/core/injection';
import { SignalStoreService } from '@melodicdev/core/state';
import { html } from '@melodicdev/core/template';

@MelodicComponent({
	selector: 'todo-list',
	template: (self) => html`
		<ul>
			${self.todos().map((todo) => html`<li>${todo}</li>`)}
		</ul>
	`
})
export class TodoListComponent {
	@Service(SignalStoreService) private store!: SignalStoreService<{ todos: string[] }>;

	todos = this.store.select('todos', (state) => state);

	add(text: string): void {
		this.store.dispatch(addTodo({ text }));
	}
}
```

## Selectors and Lifetime

`select(key, selectFn, cacheKey?)` is component-scope-aware. When called from a component (template render, `onCreate`, or a class-field initializer), the returned signal is:

- **Cached** for the component's lifetime, keyed by `(key, cacheKey ?? selectFn.toString())`. Repeated calls with the same key + selector source return the same `Signal` reference.
- **Auto-destroyed** on `disconnectedCallback`, so the underlying `SignalEffect` unsubscribes from upstream state and the dependency graph shrinks back. No manual cleanup required.

This means the common pattern below is safe: every render reads the getter, but only one computed exists per `(key, selector)` per component, and it dies with the component.

```typescript
get account() {
	return this.store.select('accountState', (s) => s.account)();
}
```

### Closure-capture caveat

The default cache key is `selectFn.toString()`. If your selector captures a variable that affects its return value, two calls with different captured values will hash to the same key and collide:

```typescript
// BAD — `perm` is captured; toString() ignores it, second call returns the cached signal for the first `perm`.
const has = this.store.select('account', (s) => s.permissions?.includes(perm))();
```

Pass an explicit `cacheKey` to discriminate:

```typescript
// GOOD — cacheKey distinguishes calls for different `perm` values.
const has = this.store.select('account', (s) => s.permissions?.includes(perm), `perm:${perm}`)();
```

Or keep selectors pure and parameterize in the consumer:

```typescript
const perms = this.store.select('account', (s) => s.permissions)();
const has = perms?.includes(perm) ?? false;
```

### Outside a component

Calling `select()` from a guard, service, or app boot path (anywhere with no active component) returns a fresh computed each call and does not auto-clean. The caller owns the lifetime — store the result and call `.destroy()` when done.

`ComponentStateBaseService.select(selectFn, cacheKey?)` follows the same contract; cache keys are scoped per service instance, so two services don't collide.

Selector **fields** defined on a `ComponentStateBaseService` subclass — the common `count = this.select(s => s.count)` pattern — are owned by the service and live for the application's lifetime. Even though the service is constructed lazily (often while a component is the active consumer), DI clears the active component during construction, so these signals are not tied to — or destroyed with — whichever component first triggered the injection.
