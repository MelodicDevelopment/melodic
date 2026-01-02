import { MelodicComponent } from '@melodicdev/core/components';
import { html, css, repeat, when, classMap } from '@melodicdev/core/template';
import { signal } from '@melodicdev/core/signals';
import { sharedVersion } from '@shared';

interface Task {
	id: number;
	text: string;
	completed: boolean;
}

@MelodicComponent({
	selector: 'app-root',
	template: (component: AppComponent) => html`
		<div class="app">
			<header class="header">
				<h1>Melodic Tasks</h1>
				<p class="subtitle">A simple task manager built with Melodic</p>
			</header>

			<div class="input-section">
				<input
					type="text"
					class="task-input"
					placeholder="What needs to be done?"
					.value=${component.newTaskText()}
					@input=${component.handleInput}
					@keydown=${component.handleKeydown}
				/>
				<button class="add-btn" @click=${component.addTask}>Add Task</button>
			</div>

			<div class="filters">
				<button
					class=${classMap({ 'filter-btn': true, active: component.filter() === 'all' })}
					@click=${() => component.setFilter('all')}
				>
					All (${component.tasks().length})
				</button>
				<button
					class=${classMap({ 'filter-btn': true, active: component.filter() === 'active' })}
					@click=${() => component.setFilter('active')}
				>
					Active (${component.activeTasks().length})
				</button>
				<button
					class=${classMap({ 'filter-btn': true, active: component.filter() === 'completed' })}
					@click=${() => component.setFilter('completed')}
				>
					Completed (${component.completedTasks().length})
				</button>
			</div>

			${when(
				component.filteredTasks().length > 0,
				() => html`
					<ul class="task-list">
						${repeat(
							component.filteredTasks(),
							(task) => `${task.id}-${task.completed}`,
							(task) => html`
								<li class=${classMap({ 'task-item': true, completed: task.completed })}>
									<label class="task-label">
										<input
											type="checkbox"
											class="task-checkbox"
											.checked=${task.completed}
											@change=${() => component.toggleTask(task.id)}
										/>
										<span class="task-text">${task.text}</span>
									</label>
									<button class="delete-btn" @click=${() => component.deleteTask(task.id)}>
										&times;
									</button>
								</li>
							`
						)}
					</ul>
				`,
				() => html`
					<div class="empty-state">
						<p>${component.filter() === 'all' ? 'No tasks yet. Add one above!' : `No ${component.filter()} tasks.`}</p>
					</div>
				`
			)}

			${when(
				component.completedTasks().length > 0,
				() => html`
					<div class="actions">
						<button class="clear-btn" @click=${component.clearCompleted}>
							Clear completed (${component.completedTasks().length})
						</button>
					</div>
				`
			)}

			<footer class="footer">
				<p>
					Built with <strong>Melodic</strong> &mdash;
					<a href="https://github.com/MelodicDevelopment/melodic" target="_blank">Learn more</a>
				</p>
				<p class="shared-version">Shared lib v${sharedVersion}</p>
			</footer>
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
			min-height: 100vh;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			padding: 2rem;
			box-sizing: border-box;
		}

		.app {
			max-width: 540px;
			margin: 0 auto;
			background: #fff;
			border-radius: 16px;
			box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
			overflow: hidden;
		}

		.header {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
			padding: 2rem;
			text-align: center;
		}

		.header h1 {
			margin: 0;
			font-size: 2rem;
			font-weight: 700;
		}

		.subtitle {
			margin: 0.5rem 0 0;
			opacity: 0.9;
			font-size: 0.9rem;
		}

		.input-section {
			display: flex;
			gap: 0.5rem;
			padding: 1.5rem;
			border-bottom: 1px solid #eee;
		}

		.task-input {
			flex: 1;
			padding: 0.875rem 1rem;
			font-size: 1rem;
			border: 2px solid #e1e5ee;
			border-radius: 8px;
			outline: none;
			transition: border-color 0.2s;
		}

		.task-input:focus {
			border-color: #667eea;
		}

		.add-btn {
			padding: 0.875rem 1.5rem;
			font-size: 1rem;
			font-weight: 600;
			color: #fff;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			border: none;
			border-radius: 8px;
			cursor: pointer;
			transition: transform 0.2s, box-shadow 0.2s;
		}

		.add-btn:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
		}

		.filters {
			display: flex;
			gap: 0.5rem;
			padding: 1rem 1.5rem;
			border-bottom: 1px solid #eee;
		}

		.filter-btn {
			flex: 1;
			padding: 0.5rem;
			font-size: 0.875rem;
			color: #666;
			background: #f5f5f5;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.2s;
		}

		.filter-btn:hover {
			background: #eee;
		}

		.filter-btn.active {
			color: #fff;
			background: #667eea;
		}

		.task-list {
			list-style: none;
			margin: 0;
			padding: 0;
		}

		.task-item {
			display: flex;
			align-items: center;
			padding: 1rem 1.5rem;
			border-bottom: 1px solid #eee;
			transition: background 0.2s;
		}

		.task-item:hover {
			background: #fafafa;
		}

		.task-item.completed .task-text {
			text-decoration: line-through;
			color: #999;
		}

		.task-label {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			flex: 1;
			cursor: pointer;
		}

		.task-checkbox {
			width: 20px;
			height: 20px;
			accent-color: #667eea;
			cursor: pointer;
		}

		.task-text {
			font-size: 1rem;
			color: #333;
		}

		.delete-btn {
			width: 32px;
			height: 32px;
			font-size: 1.25rem;
			color: #ccc;
			background: transparent;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.2s;
		}

		.delete-btn:hover {
			color: #e74c3c;
			background: #fee;
		}

		.empty-state {
			padding: 3rem 1.5rem;
			text-align: center;
			color: #999;
		}

		.actions {
			padding: 1rem 1.5rem;
			border-top: 1px solid #eee;
		}

		.clear-btn {
			width: 100%;
			padding: 0.75rem;
			font-size: 0.875rem;
			color: #e74c3c;
			background: #fff;
			border: 2px solid #e74c3c;
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.2s;
		}

		.clear-btn:hover {
			color: #fff;
			background: #e74c3c;
		}

		.footer {
			padding: 1.5rem;
			text-align: center;
			color: #999;
			font-size: 0.875rem;
			border-top: 1px solid #eee;
		}

		.footer a {
			color: #667eea;
			text-decoration: none;
		}

		.footer a:hover {
			text-decoration: underline;
		}

		.shared-version {
			margin-top: 0.5rem;
			font-size: 0.75rem;
			color: #bbb;
		}
	`
})
export class AppComponent {
	tasks = signal<Task[]>([
		{ id: 1, text: 'Learn about Melodic components', completed: true },
		{ id: 2, text: 'Build something awesome', completed: false },
		{ id: 3, text: 'Share with the community', completed: false }
	]);

	newTaskText = signal('');
	filter = signal<'all' | 'active' | 'completed'>('all');
	nextId = signal(4);

	activeTasks = (): Task[] => {
		return this.tasks().filter((task) => !task.completed);
	};

	completedTasks = (): Task[] => {
		return this.tasks().filter((task) => task.completed);
	};

	filteredTasks = (): Task[] => {
		const filterValue = this.filter();
		if (filterValue === 'active') return this.activeTasks();
		if (filterValue === 'completed') return this.completedTasks();
		return this.tasks();
	};

	handleInput = (event: Event): void => {
		const input = event.target as HTMLInputElement;
		this.newTaskText.set(input.value);
	};

	handleKeydown = (event: KeyboardEvent): void => {
		if (event.key === 'Enter') {
			this.addTask();
		}
	};

	addTask = (): void => {
		const text = this.newTaskText().trim();
		if (!text) return;

		const newTask: Task = {
			id: this.nextId(),
			text,
			completed: false
		};

		this.tasks.update((tasks) => [...tasks, newTask]);
		this.nextId.update((id) => id + 1);
		this.newTaskText.set('');
	};

	toggleTask = (id: number): void => {
		this.tasks.update((tasks) =>
			tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
		);
	};

	deleteTask = (id: number): void => {
		this.tasks.update((tasks) => tasks.filter((task) => task.id !== id));
	};

	setFilter = (filter: 'all' | 'active' | 'completed'): void => {
		this.filter.set(filter);
	};

	clearCompleted = (): void => {
		this.tasks.update((tasks) => tasks.filter((task) => !task.completed));
	};
}
