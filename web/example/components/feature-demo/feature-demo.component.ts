import { MelodicComponent } from '../../../../src/components';
import { featureDemoTemplate } from './feature-demo.template';
import { featureDemoStyles } from './feature-demo.styles';
import type { IElementRef } from '../../../../src/components/interfaces/ielement-ref.interface';
import type { OnInit } from '../../../../src/components/interfaces/ilife-cycle-hooks.interface';
import { Service } from '../../../../src/injection';
import { signal, computed } from '../../../../src/signals';
import type { Signal } from '../../../../src/signals/types/signal.type';
import { SignalStoreService } from '../../../../src/state';
import type { AppState } from '../../state/app.state';
import type { Todo } from '../../state/todos/todos.state';
import * as todoActions from '../../state/todos/todos.actions';
import { FeatureDemoComponentStateService } from './feature-demo-component-state.service';

@MelodicComponent({
	selector: 'feature-demo',
	template: featureDemoTemplate,
	styles: featureDemoStyles
})
export class FeatureDemoComponent implements IElementRef, OnInit {
	elementRef!: HTMLElement;

	// Injected services
	@Service(SignalStoreService) private readonly _store!: SignalStoreService<AppState>;
	@Service(FeatureDemoComponentStateService) private readonly _componentStateService!: FeatureDemoComponentStateService;

	title = signal<string>('Melodic Directives Showcase');
	message = '';

	// Counter state from component state service
	count: Signal<number> = this._componentStateService.count;
	lastAction: Signal<string | null> = this._componentStateService.lastAction;

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

	// Todo state from global store
	todos: Signal<Todo[]> = this._store.select('todos', (state) => state.todos);
	loading: Signal<boolean> = this._store.select('todos', (state) => state.loading);
	showCompleted: Signal<boolean> = this._store.select('todos', (state) => state.showCompleted);

	filteredTodos: Signal<Todo[]> = computed(() => {
		const todos = this.todos();
		return this.showCompleted() ? todos : todos.filter((t) => !t.completed);
	});

	newTodoText = '';
	newTodoPriority: 'low' | 'medium' | 'high' = 'medium';

	onInit(): void {
		console.log('DirectivesDemoComponent initialized!');
		this._store.dispatch(todoActions.loadTodos());
	}

	updateTitle = (e: Event) => {
		this.title.set((e.target as HTMLInputElement).value);
	};

	// Counter methods (using component state service)
	increment = () => {
		this._componentStateService.increment();
	};

	decrement = () => {
		this._componentStateService.decrement();
	};

	reset = () => {
		this._componentStateService.reset();
	};

	incrementAsync = () => {
		this._componentStateService.incrementAsync();
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
			this._store.dispatch(todoActions.addTodo({ text: this.newTodoText, priority: this.newTodoPriority }));
			this.newTodoText = '';
			this.newTodoPriority = 'medium';
		}
	};

	removeTodo = (id: number): void => {
		this._store.dispatch(todoActions.removeTodo({ id }));
	};

	toggleTodo = (id: number): void => {
		this._store.dispatch(todoActions.toggleTodo({ id }));
	};

	toggleShowCompleted = () => {
		this._store.dispatch(todoActions.toggleShowCompleted());
	};

	reverseList = (): void => {
		this._store.dispatch(todoActions.reverseList());
	};

	shuffleList = (): void => {
		this._store.dispatch(todoActions.shuffleList());
	};

	sortByPriority = (): void => {
		this._store.dispatch(todoActions.sortByPriority());
	};

	clearCompleted = (): void => {
		this._store.dispatch(todoActions.clearCompleted());
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
