import { describe, it, expect } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';
import { signal } from '../../src/signals/functions/signal.function';
import type { Signal } from '../../src/signals/types/signal.type';
import { createFormControl } from '../../src/forms';
import type { FormControl } from '../../src/forms';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

describe('reactive source reassignment', () => {
	it('re-renders from a reassigned FormControl and stops reacting to the old one', async () => {
		class ControlSwapComponent {
			field: FormControl<string> = createFormControl<string>('first');
		}

		MelodicComponent({
			selector: 'test-control-swap',
			template: (c: ControlSwapComponent) => html`<span>${c.field.value()}</span>`
		})(ControlSwapComponent);

		const element = document.createElement('test-control-swap');
		document.body.appendChild(element);
		await flushMicrotasks();

		const component = (element as unknown as { component: ControlSwapComponent }).component;
		const oldControl = component.field;
		expect(element.shadowRoot?.textContent).toContain('first');

		// Reassign the field AFTER observation — reactivity must follow.
		const newControl = createFormControl<string>('second');
		component.field = newControl;
		await flushMicrotasks();
		expect(element.shadowRoot?.textContent).toContain('second');

		newControl.setValue('third');
		await flushMicrotasks();
		expect(element.shadowRoot?.textContent).toContain('third');

		// The old control no longer drives renders.
		oldControl.setValue('stale');
		await flushMicrotasks();
		expect(element.shadowRoot?.textContent).toContain('third');

		document.body.removeChild(element);
		await flushMicrotasks();
		newControl.destroy();
	});

	it('re-renders from a reassigned Signal field', async () => {
		class SignalSwapComponent {
			counter: Signal<number> = signal(1);
		}

		MelodicComponent({
			selector: 'test-signal-swap',
			template: (c: SignalSwapComponent) => html`<span>${c.counter()}</span>`
		})(SignalSwapComponent);

		const element = document.createElement('test-signal-swap');
		document.body.appendChild(element);
		await flushMicrotasks();

		const component = (element as unknown as { component: SignalSwapComponent }).component;
		const oldSignal = component.counter;
		expect(element.shadowRoot?.textContent).toContain('1');

		const newSignal = signal(100);
		component.counter = newSignal;
		await flushMicrotasks();
		expect(element.shadowRoot?.textContent).toContain('100');

		newSignal.set(200);
		await flushMicrotasks();
		expect(element.shadowRoot?.textContent).toContain('200');

		oldSignal.set(999);
		await flushMicrotasks();
		expect(element.shadowRoot?.textContent).toContain('200');

		document.body.removeChild(element);
		await flushMicrotasks();
	});

	it('unsubscribes the old source on reassignment (no leaked subscriptions)', async () => {
		const tracked = signal(0);
		let activeSubscriptions = 0;
		const originalSubscribe = tracked.subscribe.bind(tracked);
		tracked.subscribe = (subscriber) => {
			activeSubscriptions += 1;
			const unsubscribe = originalSubscribe(subscriber);
			return () => {
				activeSubscriptions -= 1;
				unsubscribe();
			};
		};

		class LeakCheckComponent {
			source: Signal<number> = tracked;
		}

		MelodicComponent({
			selector: 'test-source-leak-check',
			template: (c: LeakCheckComponent) => html`<span>${c.source()}</span>`
		})(LeakCheckComponent);

		const element = document.createElement('test-source-leak-check');
		document.body.appendChild(element);
		await flushMicrotasks();
		expect(activeSubscriptions).toBe(1);

		const component = (element as unknown as { component: LeakCheckComponent }).component;
		component.source = signal(5);
		expect(activeSubscriptions).toBe(0);

		document.body.removeChild(element);
		await flushMicrotasks();
	});

	it('a source reassigned while disconnected subscribes on the next connect', async () => {
		class DisconnectedSwapComponent {
			counter: Signal<number> = signal(1);
		}

		MelodicComponent({
			selector: 'test-disconnected-swap',
			template: (c: DisconnectedSwapComponent) => html`<span>${c.counter()}</span>`
		})(DisconnectedSwapComponent);

		const parentA = document.createElement('div');
		const parentB = document.createElement('div');
		document.body.append(parentA, parentB);

		const element = document.createElement('test-disconnected-swap');
		parentA.appendChild(element);
		await flushMicrotasks();

		const component = (element as unknown as { component: DisconnectedSwapComponent }).component;

		// Move synchronously: reassign while detached, before the teardown microtask.
		parentA.removeChild(element);
		const newSignal = signal(42);
		component.counter = newSignal;
		parentB.appendChild(element);
		await flushMicrotasks();

		expect(element.shadowRoot?.textContent).toContain('42');

		newSignal.set(43);
		await flushMicrotasks();
		expect(element.shadowRoot?.textContent).toContain('43');

		document.body.removeChild(parentA);
		document.body.removeChild(parentB);
		await flushMicrotasks();
	});
});
