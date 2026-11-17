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
- [Reading state outside a component](#reading-state-outside-a-component)
- [Dispatch semantics](#dispatch-semantics)
- [Component State](#component-state)

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

The action type must match `'[Category] Description'`; anything else is a type error. Call
the creator to build an action: `addTodo({ text: 'Write docs' })`, `loadTodos()`.

## Reducers

Use `onAction` and `createReducer` to map actions to state changes. Pass the state type and
the slice key to `createReducer` so each reducer's `state` parameter is typed as that slice;
without them it is `unknown`.

```typescript
import { createReducer, onAction } from '@melodicdev/core/state';

interface AppState {
	todos: string[];
}

const todosReducer = createReducer<AppState, 'todos'>(
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

Effects let you respond to actions with async work and optionally dispatch follow-up actions. A handler returns a promise of one action, an array of actions, or nothing; whatever it returns is dispatched. A rejected handler is logged with `console.error` and does not stop other effects.

```typescript
import { Injectable } from '@melodicdev/core/injection';
import { EffectsBase } from '@melodicdev/core/state';

// `EffectsBase` is the supported base class: `addEffect(actions, handler)` in the
// constructor, or override `getEffects()`. (`ActionEffects` is the interface it
// implements — you rarely need to name it.)
@Injectable()
class TodosEffects extends EffectsBase {
	constructor() {
		super();

		this.addEffect([loadTodos], async () => {
			const result = await fetch('/api/todos');
			const todos = await result.json();
			return addTodo({ text: todos[0].title });
		});
	}
}
```

The store resolves each effects class through the injector the first time an action is
dispatched, so the class needs `@Injectable()`.

## Providing the Store

Use `provideRX` during bootstrap to register state, reducers, and effects.

```typescript
import { bootstrap } from '@melodicdev/core';
import { provideRX, createState, createReducer, onAction } from '@melodicdev/core/state';

const state = createState<AppState>({
	todos: []
});

const reducers = {
	todos: createReducer<AppState, 'todos'>(
		onAction(addTodo, (state, action) => [...state, action.payload.text])
	)
};

await bootstrap({
	providers: [provideRX(state, reducers, { todos: TodosEffects }, true)]
});
```

`provideRX(state, reducers, effects, debug?)` takes the effects map as a required third
argument; pass `{}` when there are none. The fourth argument turns on debug logging (each
dispatched action, its payload and the state before and after) and defaults to `false`.

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
	@Service(SignalStoreService) private store!: SignalStoreService<AppState>;

	todos = this.store.select('todos', (state) => state);

	add(text: string): void {
		this.store.dispatch(addTodo({ text }));
	}
}
```

## Selectors and Lifetime

`select(key, selectFn, cacheKey?)` is component-scope-aware. When called from a component, the returned signal is cached per component, keyed by `(key, cacheKey ?? selectFn identity)` — distinct closures never collide, even when their source text is identical. The entry's lifetime depends on where the call happens:

- **Class-field initializer or `onCreate`** — cached for the component's lifetime and auto-destroyed when the component is torn down (permanent removal; a disconnect followed by a reconnect keeps it), so the underlying subscription unsubscribes from upstream state and the dependency graph shrinks back. Holding the signal in a field also makes it a reactive source: the component re-renders when it changes.

```typescript
todos = this.store.select('todos', (s) => s);
```

- **During a render** (a template expression, or a getter the template reads) — render-scoped: the component re-renders when the selected value changes, and the entry is destroyed by the first render that stops using it. An inline arrow is recreated each render, so its captured variables are always current, and the previous render's computed is swept — nothing accumulates.

```typescript
get account() {
	return this.store.select('accountState', (s) => s.account)();
}
```

### `cacheKey`

Because the default key is the selector function's identity, an inline arrow misses the cache every render and pays a computed re-creation (the stale one is swept, so this is safe but not free). Hold selectors in stable references, or pass an explicit `cacheKey`, to get cache hits across renders — including for selectors that capture variables:

```typescript
// Cache hit across renders per `perm` value.
const has = this.store.select('accountState', (s) => s.account?.permissions?.includes(perm), `perm:${perm}`)();
```

`cacheKey` is caller intent: two calls with the same key on the same slice share one signal even if their selector functions differ, so make the key unique per distinct projection.

Or keep selectors pure and parameterize in the consumer:

```typescript
const perms = this.store.select('accountState', (s) => s.account?.permissions)();
const has = perms?.includes(perm) ?? false;
```

### Outside a component

Calling `select()` from a guard, service, or app boot path (anywhere with no active component) returns a fresh computed each call and does not auto-clean. The caller owns the lifetime — store the result and call `.destroy()` when done.

`ComponentStateBaseService.select(selectFn, cacheKey?)` follows the same contract; cache keys are scoped per service instance, so two services don't collide.

Selector **fields** defined on a `ComponentStateBaseService` subclass — the common `count = this.select(s => s.count)` pattern — are owned by the service and live for the application's lifetime. Even though the service is constructed lazily (often while a component is the active consumer), DI clears the active component during construction, so these signals are not tied to — or destroyed with — whichever component first triggered the injection.

## Reading state outside a component

`select()` returns a **live** computed. Inside a component that is what you want — the
component re-renders when the value changes, and the entry is destroyed with it. Outside
one (a guard, a resolver, a service, a one-off check) nothing ever destroys it, so every
call leaves another dependent attached to the state signal.

Use a snapshot instead:

```typescript
const state = store.snapshot();              // whole state, untracked
const cart = store.snapshotSlice('cart');    // one slice, untracked
```

If you do need a live signal outside a component, call `.destroy()` on it when you are
done.

`store.logState()` logs the same whole-state snapshot to the console.

## Dispatch semantics

`dispatch(action)` and `dispatch(key, action)` both apply **every** reducer registered for
that action type — the key form scopes it to one slice, in registration order, batched into
a single update. A slice may register more than one reducer for the same action.

The key-less form reaches every slice that registered a reducer for the action and runs
every matching effect. The key form runs only that slice's reducers and effects, and throws
`Reducer not found for key: …` when the slice has no reducer config.

## Component State

`ComponentStateBaseService` is the same actions / reducers / effects model for state that
belongs to one feature instead of the global store. It holds a single state object, needs
no `provideRX`, and extends `EffectsBase`, so effects are registered with `addEffect` in
the constructor.

```typescript
import { Injectable } from '@melodicdev/core/injection';
import { ComponentStateBaseService, createAction, createReducer, onAction, props } from '@melodicdev/core/state';

interface CounterState {
	count: number;
}

const increment = createAction('[Counter] Increment');
const setCount = createAction('[Counter] Set', props<{ count: number }>());
const incrementLater = createAction('[Counter] Increment Later');

const counterReducer = createReducer<CounterState>(
	onAction(increment, (state) => ({ ...state, count: state.count + 1 })),
	onAction(setCount, (state, action) => ({ ...state, count: action.payload.count }))
);

@Injectable()
export class CounterStateService extends ComponentStateBaseService<CounterState> {
	count = this.select((state) => state.count);

	constructor() {
		super({ count: 0 }, counterReducer);

		this.addEffect([incrementLater], async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return increment();
		});
	}

	increment(): void {
		this.dispatch(increment());
	}
}
```

Inject it into a component with `@Service(CounterStateService)` and read `count()` in the
template. `@Injectable()` registers a singleton, so every component that injects the service
shares the same state.

- `super(initState, reducerConfig?, debug?)` — the reducer config defaults to no reducers
  and `debug` to `false`.
- `select(selectFn, cacheKey?)` — a read-only signal; see
  [Selectors and Lifetime](#selectors-and-lifetime).
- `dispatch(action)` — applies **every** reducer registered for the action type, in
  registration order, as one state update, then runs the matching effects. A rejected
  effect is logged, as in the store.
- `resetState()` — sets the state back to the initial value.
- `state` (protected getter) — the current state object, for use inside the service.
- `patchState(partial)` (protected) — shallow-merges `partial` into the state without an
  action.
