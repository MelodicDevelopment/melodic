import { createReducer, onAction } from '../../../src/state';
import type { AppState } from '../app.state';
import type { Todo } from './todos.state';
import * as actions from './todos.actions';

export const todosReducers = createReducer<AppState, 'todos'>(
	// Load
	onAction(actions.loadTodos, (state) => ({
		...state,
		loading: true,
		error: null
	})),
	onAction(actions.loadTodosSuccess, (state, action) => ({
		...state,
		todos: action.payload.todos,
		loading: false,
		nextId: Math.max(...action.payload.todos.map((t) => t.id), 0) + 1
	})),
	onAction(actions.loadTodosFailure, (state, action) => ({
		...state,
		loading: false,
		error: action.payload.error
	})),

	// Add
	onAction(actions.addTodo, (state, action) => {
		const newTodo: Todo = {
			id: state.nextId,
			text: action.payload.text.trim(),
			completed: false,
			priority: action.payload.priority
		};
		return {
			...state,
			todos: [...state.todos, newTodo],
			nextId: state.nextId + 1
		};
	}),

	// Remove
	onAction(actions.removeTodo, (state, action) => ({
		...state,
		todos: state.todos.filter((todo) => todo.id !== action.payload.id)
	})),

	// Toggle
	onAction(actions.toggleTodo, (state, action) => ({
		...state,
		todos: state.todos.map((todo) => (todo.id === action.payload.id ? { ...todo, completed: !todo.completed } : todo))
	})),

	// Reverse
	onAction(actions.reverseList, (state) => ({
		...state,
		todos: [...state.todos].reverse()
	})),

	// Shuffle
	onAction(actions.shuffleList, (state) => {
		const shuffled = [...state.todos];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return { ...state, todos: shuffled };
	}),

	// Sort by priority
	onAction(actions.sortByPriority, (state) => {
		const priorityOrder = { high: 0, medium: 1, low: 2 };
		const sorted = [...state.todos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
		return { ...state, todos: sorted };
	}),

	// Clear completed
	onAction(actions.clearCompleted, (state) => ({
		...state,
		todos: state.todos.filter((todo) => !todo.completed)
	})),

	// Toggle show completed
	onAction(actions.toggleShowCompleted, (state) => ({
		...state,
		showCompleted: !state.showCompleted
	}))
);
