import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { html, render } from '../../src/template';
import { when } from '../../src/template/directives/builtin/when.directive';

describe('event bindings (stable wrapper listeners)', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
		vi.restoreAllMocks();
	});

	/** The prototype in the element chain that actually owns add/removeEventListener. */
	function eventTargetPrototype(): Record<'addEventListener' | 'removeEventListener', (...args: unknown[]) => unknown> {
		let proto = Object.getPrototypeOf(document.createElement('button'));
		while (proto && !Object.prototype.hasOwnProperty.call(proto, 'addEventListener')) {
			proto = Object.getPrototypeOf(proto);
		}
		return proto;
	}

	it('attaches ONE listener at setup and swaps handlers on re-render without add/remove churn', () => {
		const proto = eventTargetPrototype();
		const addSpy = vi.spyOn(proto, 'addEventListener');
		const removeSpy = vi.spyOn(proto, 'removeEventListener');

		let first = 0;
		let second = 0;

		render(html`<button @click=${() => (first += 1)}>Go</button>`, container);
		const button = container.querySelector('button') as HTMLButtonElement;

		const clickAdds = () => addSpy.mock.calls.filter((call) => call[0] === 'click');
		const clickRemoves = () => removeSpy.mock.calls.filter((call) => call[0] === 'click');

		expect(clickAdds().length).toBe(1);
		const registeredListener = clickAdds()[0][1];

		button.click();
		expect(first).toBe(1);

		// Handler changes on every render (fresh arrow functions) — the wrapper
		// listener must stay registered, no re-registration churn.
		render(html`<button @click=${() => (second += 1)}>Go</button>`, container);
		render(html`<button @click=${() => (second += 1)}>Go</button>`, container);

		expect(clickAdds().length).toBe(1);
		expect(clickRemoves().length).toBe(0);
		expect(clickAdds()[0][1]).toBe(registeredListener);

		button.click();
		expect(first).toBe(1);
		expect(second).toBe(1);
	});

	it('invokes plain function handlers with `this` bound to the element (direct-listener semantics)', () => {
		let receivedThis: unknown;
		function handler(this: unknown): void {
			receivedThis = this;
		}

		render(html`<button @click=${handler}>Go</button>`, container);
		const button = container.querySelector('button') as HTMLButtonElement;
		button.click();

		expect(receivedThis).toBe(button);
	});

	it('supports handleEvent objects, invoked with `this` bound to the object', () => {
		let receivedThis: unknown;
		let receivedEvent: Event | undefined;
		const listenerObject = {
			handleEvent(event: Event): void {
				receivedThis = this;
				receivedEvent = event;
			}
		};

		render(html`<button @click=${listenerObject}>Go</button>`, container);
		const button = container.querySelector('button') as HTMLButtonElement;
		button.click();

		expect(receivedThis).toBe(listenerObject);
		expect(receivedEvent?.type).toBe('click');
	});

	it('honors `once` and re-arms when a new handler value arrives', () => {
		let count = 0;
		const makeHandler = () => ({
			handleEvent: () => {
				count += 1;
			},
			once: true
		});
		const view = (handler: unknown) => html`<button @click=${handler}>Go</button>`;

		const firstHandler = makeHandler();
		render(view(firstHandler), container);
		const button = container.querySelector('button') as HTMLButtonElement;

		button.click();
		button.click();
		expect(count).toBe(1);

		// Same value re-rendered: still spent.
		render(view(firstHandler), container);
		button.click();
		expect(count).toBe(1);

		// New handler value: re-armed, fires exactly once again.
		render(view(makeHandler()), container);
		button.click();
		button.click();
		expect(count).toBe(2);
	});

	it('re-attaches the same wrapper when listener options change', () => {
		let captureCalls = 0;
		const view = (handler: unknown) => html`<button @click=${handler}>Go</button>`;

		render(view({ handleEvent: () => {}, capture: false }), container);
		const button = container.querySelector('button') as HTMLButtonElement;

		const addSpy = vi.spyOn(button, 'addEventListener');
		const removeSpy = vi.spyOn(button, 'removeEventListener');

		render(view({ handleEvent: () => (captureCalls += 1), capture: true }), container);

		const removes = removeSpy.mock.calls.filter((call) => call[0] === 'click');
		const adds = addSpy.mock.calls.filter((call) => call[0] === 'click');
		expect(removes.length).toBe(1);
		expect(adds.length).toBe(1);
		// Stable wrapper identity survives the re-attach.
		expect(adds[0][1]).toBe(removes[0][1]);
		expect((adds[0][2] as AddEventListenerOptions).capture).toBe(true);

		button.click();
		expect(captureCalls).toBe(1);
	});

	it('detaches when the handler becomes undefined and re-attaches for a new handler', () => {
		let count = 0;
		const view = (handler: unknown) => html`<button @click=${handler}>Go</button>`;

		render(view(() => (count += 1)), container);
		const button = container.querySelector('button') as HTMLButtonElement;

		button.click();
		expect(count).toBe(1);

		render(view(undefined), container);
		button.click();
		expect(count).toBe(1);

		render(view(() => (count += 1)), container);
		button.click();
		expect(count).toBe(2);
	});

	it('removes the stable listener when the containing branch is disposed (when-toggle)', () => {
		let count = 0;
		const handler = () => {
			count += 1;
		};
		const view = (show: boolean) => html`<div>${when(show, () => html`<button @click=${handler}>Go</button>`)}</div>`;

		render(view(true), container);
		const button = container.querySelector('button') as HTMLButtonElement;
		button.click();
		expect(count).toBe(1);

		const removeSpy = vi.spyOn(button, 'removeEventListener');
		render(view(false), container);

		// Disposal removed the wrapper listener from the discarded node …
		expect(removeSpy.mock.calls.some((call) => call[0] === 'click')).toBe(true);
		// … so even a dispatch on the detached node no longer reaches the handler.
		button.click();
		expect(count).toBe(1);
	});
});
