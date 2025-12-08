import { createAction, props } from '../../../src/state';
import type { Todo } from './todos.state';

// Load todos
export const loadTodos = createAction('[Todos] Load');
export const loadTodosSuccess = createAction('[Todos] Load Success', props<{ todos: Todo[] }>());
export const loadTodosFailure = createAction('[Todos] Load Failure', props<{ error: string }>());

// CRUD operations
export const addTodo = createAction('[Todos] Add', props<{ text: string; priority: 'low' | 'medium' | 'high' }>());
export const removeTodo = createAction('[Todos] Remove', props<{ id: number }>());
export const toggleTodo = createAction('[Todos] Toggle', props<{ id: number }>());

// List operations
export const reverseList = createAction('[Todos] Reverse List');
export const shuffleList = createAction('[Todos] Shuffle List');
export const sortByPriority = createAction('[Todos] Sort By Priority');
export const clearCompleted = createAction('[Todos] Clear Completed');

// Filter
export const toggleShowCompleted = createAction('[Todos] Toggle Show Completed');
