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

		expect(cleanupCalls).toBe(1);
		unregisterAttributeDirective('cleanupTest');
	});
});
