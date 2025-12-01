import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { myAppTemplate } from './my-app.template';
import { myAppStyles } from './my-app.styles';
import type { IElementRef } from '../../../src/components/interfaces/ielement-ref.interface';
import type { OnInit } from '../../../src/components/interfaces/ilife-cycle-hooks.interface';
import { Inject, Service } from '../../../src/injection';
import { TodoService, type Todo } from '../../services/todo.service';
import { signal } from '../../../src/signals/functions/signal.function';

@MelodicComponent({
	selector: 'my-app',
	template: myAppTemplate,
	styles: myAppStyles
})
export class MyAppComponent implements IElementRef, OnInit {
	elementRef!: HTMLElement;

	// Injected service
	// @Service(TodoService) private _todoService!: TodoService;

	title = signal<string>('Melodic Directives Showcase');
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

	todos: Todo[] = this._todoService.getTodos();

	newTodoText = '';
	newTodoPriority: 'low' | 'medium' | 'high' = 'medium';
	showCompleted = true;

	get filteredTodos(): Todo[] {
		return this.showCompleted ? this.todos : this.todos.filter((t) => !t.completed);
	}

	constructor(@Inject(TodoService) private _todoService: TodoService) {}

	onInit(): void {
		console.log('MyAppComponent initialized with TodoService!');
		console.log('ElementRef:', this.elementRef);
		console.log('TodoService instance:', this._todoService);
	}

	updateTitle = (e: Event) => {
		this.title.value = (e.target as HTMLInputElement).value;
	};

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

	addTodo = (): void => {
		if (this.newTodoText.trim()) {
			this._todoService.addTodo(this.newTodoText, this.newTodoPriority);
			this.newTodoText = '';
			this.newTodoPriority = 'medium';
		}
	};

	removeTodo = (id: number): void => {
		this._todoService.removeTodo(id);
	};

	toggleTodo = (id: number): void => {
		this._todoService.toggleTodo(id);
	};

	toggleShowCompleted = () => {
		this.showCompleted = !this.showCompleted;
	};

	reverseList = (): void => {
		this._todoService.reverseList();
	};

	shuffleList = (): void => {
		this._todoService.shuffleList();
	};

	sortByPriority = (): void => {
		this._todoService.sortByPriority();
	};

	clearCompleted = (): void => {
		this._todoService.clearCompleted();
	};

	getPriorityColor = (priority: 'low' | 'medium' | 'high'): string => {
		return this._todoService.getPriorityColor(priority);
	};
}
