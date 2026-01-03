export interface Todo {
	id: number;
	text: string;
	completed: boolean;
	priority: 'low' | 'medium' | 'high';
}

export interface TodosState {
	todos: Todo[];
	loading: boolean;
	error: string | null;
	showCompleted: boolean;
	nextId: number;
}

export const initialTodosState: TodosState = {
	todos: [],
	loading: false,
	error: null,
	showCompleted: true,
	nextId: 1
};
