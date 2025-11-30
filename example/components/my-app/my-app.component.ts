import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { myAppTemplate } from './my-app.template';
import { myAppStyles } from './my-app.styles';
import type { IElementRef } from '../../../src/components/interfaces/ielement-ref.interface';
import type { OnInit } from '../../../src/components/interfaces/ilife-cycle-hooks.interface';
import { Injector } from '../../../src/injection';
import { TodoService, type Todo } from '../../services/todo.service';

@MelodicComponent({
	selector: 'my-app',
	template: myAppTemplate,
	styles: myAppStyles
})
export class MyAppComponent implements IElementRef, OnInit {
	elementRef!: HTMLElement;

	// Injected service
	#todoService = Injector.get<TodoService>('TodoService');

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

	// Todo list state (delegated to service)
	todos: Todo[] = this.#todoService.getTodos();
	newTodoText = '';
	newTodoPriority: 'low' | 'medium' | 'high' = 'medium';
	showCompleted = true;

	get filteredTodos(): Todo[] {
		return this.showCompleted ? this.todos : this.todos.filter((t) => !t.completed);
	}

	onInit(): void {
		console.log('MyAppComponent initialized with TodoService!');
		console.log('ElementRef:', this.elementRef);
		console.log('TodoService instance:', this.#todoService);
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
			this.todos = this.#todoService.addTodo(this.newTodoText, this.newTodoPriority);
			this.newTodoText = '';
			this.newTodoPriority = 'medium';
		}
	};

	removeTodo = (id: number) => {
		this.todos = this.#todoService.removeTodo(id);
	};

	toggleTodo = (id: number) => {
		this.todos = this.#todoService.toggleTodo(id);
	};

	toggleShowCompleted = () => {
		this.showCompleted = !this.showCompleted;
	};

	reverseList = () => {
		this.todos = this.#todoService.reverseList();
	};

	shuffleList = () => {
		this.todos = this.#todoService.shuffleList();
	};

	sortByPriority = () => {
		this.todos = this.#todoService.sortByPriority();
	};

	clearCompleted = () => {
		this.todos = this.#todoService.clearCompleted();
	};

	getPriorityColor = (priority: 'low' | 'medium' | 'high'): string => {
		return this.#todoService.getPriorityColor(priority);
	};
}
