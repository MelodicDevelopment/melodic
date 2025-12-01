import { html, repeat, when, classMap, styleMap, unsafeHTML } from '../../../src/index';
import type { MyAppComponent } from './my-app.component';

export function myAppTemplate(component: MyAppComponent) {
	return html`
		<div class="container">
			<h1>${component.title.value}</h1>

			<hr />

			<!-- Input to update title signal -->
			<section class="title-update">
				<h2>Update Title</h2>
				<input type="text" .value=${component.title.value} @input=${component.updateTitle} placeholder="Update title..." />
			</section>

			<hr />

			<section class="counter">
				<h2>Counter Demo</h2>
				<p>Count: ${component.count}</p>
				<button @click=${component.increment}>Increment</button>
				<button @click=${component.reset}>Reset</button>

				<!-- when() directive demo -->
				${when(component.count >= 10, () => html` <div class="alert alert-success"><� You've reached 10! Great job!</div> `)}
				${when(component.count < 0, () => html` <div class="alert alert-warning">� Count is negative!</div> `)}
			</section>

			<hr />

			<section class="input-demo">
				<h2>Input Binding Demo</h2>
				<input type="text" .value=${component.message} @input=${component.updateMessage} placeholder="Type something..." />

				<!-- Dynamic styling with styleMap() -->
				<p
					style=${styleMap({
						color: component.message.length > 10 ? 'green' : 'gray',
						fontSize: `${Math.min(12 + component.message.length, 24)}px`,
						fontWeight: component.message.length > 5 ? 'bold' : 'normal'
					})}
				>
					You typed: ${component.message} (${component.message.length} characters)
				</p>

				${when(component.message.length > 20, () => html` <div class="alert alert-info">( Wow, that's a long message!</div> `)}
			</section>

			<hr />

			<section class="directives-demo">
				<h2>Directives Showcase</h2>

				<div class="showcase-grid">
					<div class="showcase-card">
						<h3>when() - Conditional Rendering</h3>
						<p>Toggle to see content appear/disappear:</p>
						<button @click=${component.toggleFeature} class="secondary">Toggle Feature</button>
						${when(
							component.showFeature,
							() => html`
								<div class="feature-box">
									 Feature is enabled!
									<br />
									This content is completely removed from the DOM when hidden.
								</div>
							`
						)}
					</div>

					<div class="showcase-card">
						<h3>classMap() - Dynamic Classes</h3>
						<p>Classes change based on state:</p>
						<div
							class=${classMap({
								'demo-box': true,
								'active': component.isActive,
								'disabled': !component.isEnabled,
								'pulsing': component.isPulsing
							})}
						>
							Dynamic Box
						</div>
						<button @click=${component.toggleActive} class="secondary">Toggle Active</button>
						<button @click=${component.toggleEnabled} class="secondary">Toggle Enabled</button>
						<button @click=${component.togglePulsing} class="secondary">Toggle Pulse</button>
					</div>

					<div class="showcase-card">
						<h3>styleMap() - Dynamic Styles</h3>
						<p>Inline styles from object:</p>
						<div
							class="style-demo-box"
							style=${styleMap({
								backgroundColor: component.boxColor,
								transform: `scale(${component.boxScale})`,
								borderRadius: `${component.boxRadius}px`
							})}
						>
							Styled!
						</div>
						<div class="controls">
							<label>
								Color:
								<input type="color" .value=${component.boxColor} @input=${component.updateBoxColor} />
							</label>
							<label>
								Scale:
								<input type="range" min="0.5" max="2" step="0.1" .value=${String(component.boxScale)} @input=${component.updateBoxScale} />
								${component.boxScale}x
							</label>
							<label>
								Radius:
								<input type="range" min="0" max="50" .value=${String(component.boxRadius)} @input=${component.updateBoxRadius} />
								${component.boxRadius}px
							</label>
						</div>
					</div>

					<div class="showcase-card">
						<h3>unsafeHTML() - Raw HTML</h3>
						<p class="warning">� Only use with trusted content!</p>
						<div class="html-demo">${unsafeHTML(component.safeHTMLContent)}</div>
						<button @click=${component.cycleSafeHTML} class="secondary">Change Content</button>
					</div>
				</div>
			</section>

			<hr />

			<section class="list-demo">
				<h2>Keyed List Demo (repeat directive)</h2>
				<p class="info">
					( Using <code>repeat()</code> directive for optimal DOM updates! Try adding, removing, or reordering items - only changed nodes are updated.
				</p>

				<div class="todo-input">
					<input
						type="text"
						.value=${component.newTodoText}
						@input=${component.updateNewTodo}
						@keyup=${component.handleKeyup}
						placeholder="Add a new todo..."
					/>
					<select .value=${component.newTodoPriority} @change=${component.updatePriority}>
						<option value="low">Low Priority</option>
						<option value="medium">Medium Priority</option>
						<option value="high">High Priority</option>
					</select>
					<button @click=${component.addTodo} class="add-btn">Add Todo</button>
				</div>

				<div class="todo-actions">
					<button @click=${component.reverseList} class="secondary">= Reverse List</button>
					<button @click=${component.shuffleList} class="secondary"><� Shuffle List</button>
					<button @click=${component.sortByPriority} class="secondary"> Sort by Priority</button>
					<button @click=${component.clearCompleted} class="secondary">=� Clear Completed</button>
				</div>

				<!-- Show/hide completed todos using when() -->
				<div class="filter-controls">
					<label>
						<input type="checkbox" .checked=${component.showCompleted} @change=${component.toggleShowCompleted} />
						Show completed todos
					</label>
				</div>

				<ul class="todo-list">
					${repeat(
						component.filteredTodos,
						(todo) => todo.id,
						(todo) => html`
							<li
								class=${classMap({
									'completed': todo.completed,
									'priority-high': todo.priority === 'high',
									'priority-medium': todo.priority === 'medium',
									'priority-low': todo.priority === 'low'
								})}
							>
								<input type="checkbox" .checked=${todo.completed} @change=${() => component.toggleTodo(todo.id)} />
								<span class="todo-text">${todo.text}</span>
								<span class="todo-id">(ID: ${todo.id})</span>
								<span
									class="priority-badge"
									style=${styleMap({
										backgroundColor: component.getPriorityColor(todo.priority),
										color: 'white'
									})}
								>
									${todo.priority}
								</span>
								<button @click=${() => component.removeTodo(todo.id)} class="delete-btn">�</button>
							</li>
						`
					)}
				</ul>

				${when(
					component.filteredTodos.length === 0,
					() => html`
						<div class="empty-state">
							${component.showCompleted ? "<� No todos! You're all done!" : '( No active todos. Add one above or show completed todos.'}
						</div>
					`
				)}

				<p class="stats">
					Total: ${component.todos.length} | Active: ${component.todos.filter((t) => !t.completed).length} | Completed:
					${component.todos.filter((t) => t.completed).length}
				</p>
			</section>
		</div>
	`;
}
