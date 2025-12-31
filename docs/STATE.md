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
