import { Injectable } from '../../src/injection';
import { computed } from '../../src/signals/functions/computed.function';
import { signal } from '../../src/signals/functions/signal.function';
import type { Signal } from '../../src/signals/types/signal.type';

export interface Todo {
	id: number;
	text: string;
	completed: boolean;
	priority: 'low' | 'medium' | 'high';
}

@Injectable({
	singleton: true
})
export class TodoService {
	private nextId = 4;

	public showCompleted: Signal<boolean> = signal(true);

	public todos: Signal<Todo[]> = signal([
		{ id: 1, text: 'Learn Melodic framework', completed: false, priority: 'high' },
		{ id: 2, text: 'Build awesome app', completed: false, priority: 'medium' },
		{ id: 3, text: 'Deploy to production', completed: false, priority: 'low' }
	]);

	public filteredTodos: Signal<Todo[]> = computed(() => {
		return this.showCompleted() ? this.todos() : this.todos().filter((t) => !t.completed);
	});

	addTodo(text: string, priority: 'low' | 'medium' | 'high' = 'medium'): void {
		const newTodo: Todo = {
			id: this.nextId++,
			text: text.trim(),
			completed: false,
			priority
		};

		this.todos.update((todos) => [...todos, newTodo]);
	}

	removeTodo(id: number): void {
		this.todos.update((todos) => todos.filter((todo) => todo.id !== id));
	}

	toggleTodo(id: number): void {
		this.todos.update((todos) => todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
	}

	reverseList(): void {
		this.todos.update((todos) => [...todos].reverse());
	}

	shuffleList(): void {
		const shuffled = [...this.todos()];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		this.todos.update(() => shuffled);
	}

	sortByPriority(): void {
		const priorityOrder = { high: 0, medium: 1, low: 2 };
		this.todos.update((todos) => [...todos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]));
	}

	clearCompleted(): void {
		this.todos.update((todos) => todos.filter((todo) => !todo.completed));
	}

	getPriorityColor(priority: 'low' | 'medium' | 'high'): string {
		const colors = {
			high: '#dc3545',
			medium: '#ffc107',
			low: '#28a745'
		};
		return colors[priority];
	}
}
