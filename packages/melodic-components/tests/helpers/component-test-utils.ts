/**
 * Shared test utilities for Melodic component tests.
 */

/** Flush one microtask so batched renders settle. */
export function flush(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

/** Create a component, optionally set properties/attributes, append to DOM. */
export function createComponent<T extends HTMLElement>(
	tag: string,
	options: { properties?: Record<string, unknown>; attributes?: Record<string, string> } = {}
): T {
	const el = document.createElement(tag) as T;

	if (options.attributes) {
		for (const [key, value] of Object.entries(options.attributes)) {
			el.setAttribute(key, value);
		}
	}

	// Append first so connectedCallback fires and shadow DOM is created
	document.body.appendChild(el);

	if (options.properties) {
		for (const [key, value] of Object.entries(options.properties)) {
			(el as any)[key] = value;
		}
	}

	return el;
}

/** Remove a component from the DOM. */
export function removeComponent(el: HTMLElement): void {
	el.remove();
}

/** Query a single element inside the component's shadow root. */
export function shadowQuery<T extends Element = Element>(host: HTMLElement, selector: string): T | null {
	return host.shadowRoot?.querySelector<T>(selector) ?? null;
}

/** Query all matching elements inside the component's shadow root. */
export function shadowQueryAll<T extends Element = Element>(host: HTMLElement, selector: string): T[] {
	return Array.from(host.shadowRoot?.querySelectorAll<T>(selector) ?? []);
}

/** Get the trimmed text content of the shadow root. */
export function shadowText(host: HTMLElement): string {
	return host.shadowRoot?.textContent?.trim() ?? '';
}

/** Check if an element inside shadow DOM has a specific class. */
export function shadowHasClass(host: HTMLElement, selector: string, className: string): boolean {
	const el = shadowQuery(host, selector);
	return el?.classList.contains(className) ?? false;
}

/** Returns a promise that resolves with the next dispatched CustomEvent. */
export function captureEvent<T = unknown>(element: HTMLElement, eventName: string): Promise<CustomEvent<T>> {
	return new Promise((resolve) => {
		element.addEventListener(
			eventName,
			(e) => resolve(e as CustomEvent<T>),
			{ once: true }
		);
	});
}

/** Simulate typing a value into an input/textarea inside shadow DOM. */
export async function typeInto(host: HTMLElement, selector: string, value: string): Promise<void> {
	const el = shadowQuery<HTMLInputElement | HTMLTextAreaElement>(host, selector);
	if (!el) throw new Error(`typeInto: element "${selector}" not found in shadow DOM`);
	el.value = value;
	el.dispatchEvent(new Event('input', { bubbles: true }));
	await flush();
}

/** Focus an element inside shadow DOM. */
export function focusShadow(host: HTMLElement, selector: string): void {
	const el = shadowQuery<HTMLElement>(host, selector);
	if (!el) throw new Error(`focusShadow: element "${selector}" not found in shadow DOM`);
	el.dispatchEvent(new Event('focus', { bubbles: true }));
}

/** Blur an element inside shadow DOM. */
export function blurShadow(host: HTMLElement, selector: string): void {
	const el = shadowQuery<HTMLElement>(host, selector);
	if (!el) throw new Error(`blurShadow: element "${selector}" not found in shadow DOM`);
	el.dispatchEvent(new Event('blur', { bubbles: true }));
}
