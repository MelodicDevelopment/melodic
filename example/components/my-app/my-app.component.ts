import { MelodicComponent } from '../../../src/index';
import { myAppTemplate } from './my-app.template';
import { myAppStyles } from './my-app.styles';

export interface Todo {
	id: number;
	text: string;
	completed: boolean;
	priority: 'low' | 'medium' | 'high';
}

@MelodicComponent({
	selector: 'my-app',
	template: myAppTemplate,
	styles: myAppStyles
})
export class MyApp {
	title = 'Melodic Directives Showcase';
	count = 0;
	message = '';

	// Directive demo state
	showFeature = false;
	isActive = true;
	isEnabled = true;
	isPulsing = false;
	boxColor = '#007bff';
	boxScale = 1;
	boxRadius = 8;

	safeHTMLExamples = [
		'<strong>Bold text</strong> and <em>italic text</em>',
		'<span style="color: red;">Colored text</span>',
		'<code>console.log("Hello!");</code>',
		'<mark>Highlighted text</mark>',
		'<u>Underlined</u> and <s>strikethrough</s>'
	];
	safeHTMLIndex = 0;

	get safeHTMLContent() {
		return this.safeHTMLExamples[this.safeHTMLIndex];
	}

	// Todo list state
	todos: Todo[] = [
		{ id: 1, text: 'Learn Melodic framework', completed: false, priority: 'high' },
		{ id: 2, text: 'Build awesome app', completed: false, priority: 'medium' },
		{ id: 3, text: 'Deploy to production', completed: false, priority: 'low' }
	];
	newTodoText = '';
	newTodoPriority: 'low' | 'medium' | 'high' = 'medium';
	nextId = 4;
	showCompleted = true;

	get filteredTodos() {
		return this.showCompleted ? this.todos : this.todos.filter(t => !t.completed);
	}

	// Counter methods
	increment = () => {
		this.count++;
	};

	reset = () => {
		this.count = 0;
	};

	// Input methods
	updateMessage = (e: Event) => {
		this.message = (e.target as HTMLInputElement).value;
	};

	// Directive demo methods
	toggleFeature = () => {
		this.showFeature = !this.showFeature;
	};

	toggleActive = () => {
		this.isActive = !this.isActive;
	};

	toggleEnabled = () => {
		this.isEnabled = !this.isEnabled;
	};

	togglePulsing = () => {
		this.isPulsing = !this.isPulsing;
	};

	updateBoxColor = (e: Event) => {
		this.boxColor = (e.target as HTMLInputElement).value;
	};

	updateBoxScale = (e: Event) => {
		this.boxScale = parseFloat((e.target as HTMLInputElement).value);
	};

	updateBoxRadius = (e: Event) => {
		this.boxRadius = parseInt((e.target as HTMLInputElement).value);
	};

	cycleSafeHTML = () => {
		this.safeHTMLIndex = (this.safeHTMLIndex + 1) % this.safeHTMLExamples.length;
	};

	// Todo methods
	updateNewTodo = (e: Event) => {
		this.newTodoText = (e.target as HTMLInputElement).value;
	};

	updatePriority = (e: Event) => {
		this.newTodoPriority = (e.target as HTMLSelectElement).value as 'low' | 'medium' | 'high';
	};

	handleKeyup = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			this.addTodo();
		}
	};

	addTodo = () => {
		if (this.newTodoText.trim()) {
			this.todos = [
				...this.todos,
				{
					id: this.nextId++,
					text: this.newTodoText.trim(),
					completed: false,
					priority: this.newTodoPriority
				}
			];
			this.newTodoText = '';
			this.newTodoPriority = 'medium';
		}
	};

	removeTodo = (id: number) => {
		this.todos = this.todos.filter(todo => todo.id !== id);
	};

	toggleTodo = (id: number) => {
		this.todos = this.todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
	};

	toggleShowCompleted = () => {
		this.showCompleted = !this.showCompleted;
	};

	reverseList = () => {
		this.todos = [...this.todos].reverse();
	};

	shuffleList = () => {
		const shuffled = [...this.todos];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		this.todos = shuffled;
	};

	sortByPriority = () => {
		const priorityOrder = { high: 0, medium: 1, low: 2 };
		this.todos = [...this.todos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
	};

	clearCompleted = () => {
		this.todos = this.todos.filter(todo => !todo.completed);
	};

	getPriorityColor = (priority: 'low' | 'medium' | 'high'): string => {
		const colors = {
			high: '#dc3545',
			medium: '#ffc107',
			low: '#28a745'
		};
		return colors[priority];
	};
}
