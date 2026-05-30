import { describe, it, expect } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';
import { registerAttributeDirective, unregisterAttributeDirective } from '../../src/template/directives/functions/attribute-directive.functions';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

describe('component lifecycle', () => {
	it('batches renders triggered by multiple property updates', async () => {
		let renderCount = 0;
		class CounterComponent {
			count = 0;

			onRender(): void {
				renderCount += 1;
			}
		}

		MelodicComponent({
			selector: 'test-counter-component',
			template: (component: CounterComponent) => html`<span>${component.count}</span>`
		})(CounterComponent);

		const element = document.createElement('test-counter-component') as any;
		document.body.appendChild(element);

		expect(renderCount).toBe(1);

		element.count = 1;
		element.count = 2;
		await flushMicrotasks();

		expect(renderCount).toBe(2);
		expect(element.shadowRoot?.textContent).toContain('2');

		document.body.removeChild(element);
	});

	it('runs action directive cleanup on disconnect', async () => {
		let cleanupCalls = 0;
		registerAttributeDirective('cleanupTest', () => {
			return () => {
				cleanupCalls += 1;
			};
		});

		class CleanupComponent {
			value = 'ok';
		}

		MelodicComponent({
			selector: 'test-cleanup-component',
			template: (component: CleanupComponent) => html`<div :cleanupTest=${component.value}></div>`
		})(CleanupComponent);

		const element = document.createElement('test-cleanup-component');
		document.body.appendChild(element);
		await flushMicrotasks();
		document.body.removeChild(element);
		// Action cleanup runs on the deferred final teardown, not the synchronous
		// disconnect, so a transient move doesn't churn directive listeners.
		await flushMicrotasks();

		expect(cleanupCalls).toBe(1);
		unregisterAttributeDirective('cleanupTest');
	});

	it('fires onCreate once but onConnect/onDisconnect on every move', async () => {
		const calls = { create: 0, connect: 0, disconnect: 0 };

		class MoveTrackerComponent {
			onCreate(): void {
				calls.create += 1;
			}
			onConnect(): void {
				calls.connect += 1;
			}
			onDisconnect(): void {
				calls.disconnect += 1;
			}
		}

		MelodicComponent({
			selector: 'test-move-tracker',
			template: () => html`<div></div>`
		})(MoveTrackerComponent);

		const parentA = document.createElement('div');
		const parentB = document.createElement('div');
		document.body.append(parentA, parentB);

		const element = document.createElement('test-move-tracker');
		parentA.appendChild(element);
		await flushMicrotasks();

		// Move the element (remove + re-add before teardown microtask).
		parentA.removeChild(element);
		parentB.appendChild(element);
		await flushMicrotasks();

		expect(calls.create).toBe(1); // once, ever
		expect(calls.connect).toBe(2); // first mount + re-mount
		expect(calls.disconnect).toBe(1); // the move

		document.body.removeChild(parentA);
		document.body.removeChild(parentB);
	});

	it('re-establishes reactivity after the element is moved', async () => {
		class ReactiveMoveComponent {
			count = 0;
		}

		MelodicComponent({
			selector: 'test-reactive-move',
			template: (component: ReactiveMoveComponent) => html`<span>${component.count}</span>`
		})(ReactiveMoveComponent);

		const parentA = document.createElement('div');
		const parentB = document.createElement('div');
		document.body.append(parentA, parentB);

		const element = document.createElement('test-reactive-move') as any;
		parentA.appendChild(element);
		await flushMicrotasks();

		parentA.removeChild(element);
		parentB.appendChild(element);
		await flushMicrotasks();

		// After the move, property changes still trigger a re-render.
		element.count = 7;
		await flushMicrotasks();
		expect(element.shadowRoot?.textContent).toContain('7');

		document.body.removeChild(parentA);
		document.body.removeChild(parentB);
	});
});
