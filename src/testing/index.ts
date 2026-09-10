/**
 * `@melodicdev/core/testing` — helpers for testing Melodic components.
 *
 * Every test in this repo used to hand-roll the same three things: a
 * `flushMicrotasks` helper, element creation plus append, and cleanup. They are
 * subtle enough to get wrong (a component renders in a microtask, and teardown
 * is deferred by another one), so they belong in the framework.
 *
 * ```typescript
 * import { mount, flush } from '@melodicdev/core/testing';
 *
 * const el = await mount('my-counter', { count: 3 });
 * el.shadowRoot!.querySelector('button')!.click();
 * await flush();
 * expect(text(el)).toContain('4');
 * el.unmount();
 * ```
 */

import type { ComponentBase } from '../components/classes/component-base.class';
import type { Component } from '../components/types/component.type';

/** A mounted element plus the conveniences a test needs. */
export interface IMountedComponent<C extends Component = Component> extends HTMLElement {
	/** The user's component instance. */
	component: C;
	/** Remove the element and let its deferred teardown run. */
	unmount(): Promise<void>;
}

export interface IMountOptions {
	/** Where to mount (default: a fresh `<div>` appended to `document.body`). */
	container?: HTMLElement;
	/** Attributes to set before the element is connected. */
	attributes?: Record<string, string>;
}

const mounted = new Set<{ element: HTMLElement; host: HTMLElement | null }>();

/**
 * Let every pending microtask (render scheduling, deferred teardown) run.
 *
 * A macrotask turn is used because Melodic schedules renders on microtasks and
 * teardown on a microtask queued from a microtask: awaiting a single
 * `Promise.resolve()` is not enough, and tests that did so were flaky.
 */
export function flush(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create, connect and render a component, then wait for its first render.
 *
 * `properties` are assigned BEFORE the element is connected, exactly as a
 * parent template's `.prop=` bindings would.
 */
export async function mount<C extends Component = Component>(
	selector: string,
	properties: Record<string, unknown> = {},
	options: IMountOptions = {}
): Promise<IMountedComponent<C>> {
	if (!customElements.get(selector)) {
		throw new Error(`mount('${selector}'): no component is registered under that selector. Import the component module before mounting it.`);
	}

	const host = options.container ?? document.createElement('div');
	if (!options.container) {
		document.body.appendChild(host);
	}

	const element = document.createElement(selector) as IMountedComponent<C>;

	for (const [name, value] of Object.entries(options.attributes ?? {})) {
		element.setAttribute(name, value);
	}

	for (const [name, value] of Object.entries(properties)) {
		(element as unknown as Record<string, unknown>)[name] = value;
	}

	host.appendChild(element);

	const entry = { element, host: options.container ? null : host };
	mounted.add(entry);

	element.unmount = async (): Promise<void> => {
		element.remove();
		entry.host?.remove();
		mounted.delete(entry);
		await flush();
	};

	await flush();

	return element;
}

/** Remove everything `mount()` created. Call from an `afterEach`. */
export async function unmountAll(): Promise<void> {
	for (const entry of [...mounted]) {
		entry.element.remove();
		entry.host?.remove();
		mounted.delete(entry);
	}

	await flush();
}

/** Shadow-DOM query helper. */
export function query<E extends Element = Element>(element: HTMLElement, selector: string): E | null {
	return (element.shadowRoot ?? element).querySelector<E>(selector);
}

/** Shadow-DOM query-all helper. */
export function queryAll<E extends Element = Element>(element: HTMLElement, selector: string): E[] {
	return [...(element.shadowRoot ?? element).querySelectorAll<E>(selector)];
}

/** Rendered text of a component's shadow root, whitespace-collapsed. */
export function text(element: HTMLElement): string {
	return ((element.shadowRoot ?? element).textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Collect events of `name` dispatched from `element` until the returned
 * function is called, which stops listening and returns what was captured.
 */
export function captureEvents<T = unknown>(element: EventTarget, name: string): () => Array<CustomEvent<T>> {
	const events: Array<CustomEvent<T>> = [];
	const listener = (event: Event): void => {
		events.push(event as CustomEvent<T>);
	};

	element.addEventListener(name, listener);

	return () => {
		element.removeEventListener(name, listener);
		return events;
	};
}

/** The `ComponentBase` wrapper behind a mounted element (render counts, etc.). */
export function base(element: HTMLElement): ComponentBase {
	return element as unknown as ComponentBase;
}
