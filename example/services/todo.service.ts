import { Injectable } from '../../src/injection';

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
	private todos: Todo[] = [
		{ id: 1, text: 'Learn Melodic framework', completed: false, priority: 'high' },
		{ id: 2, text: 'Build awesome app', completed: false, priority: 'medium' },
		{ id: 3, text: 'Deploy to production', completed: false, priority: 'low' }
	];
	private nextId = 4;

	getTodos(): Todo[] {
		return this.todos;
	}

	getFilteredTodos(showCompleted: boolean): Todo[] {
		return showCompleted ? this.todos : this.todos.filter((t) => !t.completed);
	}

	addTodo(text: string, priority: 'low' | 'medium' | 'high' = 'medium'): Todo[] {
		const newTodo: Todo = {
			id: this.nextId++,
			text: text.trim(),
			completed: false,
			priority
		};
		this.todos = [...this.todos, newTodo];
		return this.todos;
	}

	removeTodo(id: number): Todo[] {
		this.todos = this.todos.filter((todo) => todo.id !== id);
		return this.todos;
	}

	toggleTodo(id: number): Todo[] {
		this.todos = this.todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
		return this.todos;
	}

	reverseList(): Todo[] {
		this.todos = [...this.todos].reverse();
		return this.todos;
	}

	shuffleList(): Todo[] {
		const shuffled = [...this.todos];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		this.todos = shuffled;
		return this.todos;
	}

	sortByPriority(): Todo[] {
		const priorityOrder = { high: 0, medium: 1, low: 2 };
		this.todos = [...this.todos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
		return this.todos;
	}

	clearCompleted(): Todo[] {
		this.todos = this.todos.filter((todo) => !todo.completed);
		return this.todos;
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
