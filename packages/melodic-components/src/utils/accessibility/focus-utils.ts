const FOCUSABLE_SELECTOR = [
	'a[href]',
	'area[href]',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'button:not([disabled])',
	'iframe',
	'object',
	'embed',
	'[contenteditable]',
	'[tabindex]:not([tabindex="-1"])'
].join(', ');

export interface GetFocusableOptions {
	/**
	 * Walk the composed (flattened) tree: descend into the shadow roots of
	 * nested custom elements and follow `<slot>`s to their assigned content,
	 * returning elements in tab order. Default false — only the container's own
	 * tree is searched, as before.
	 */
	deep?: boolean;
}

function isVisiblyFocusable(element: HTMLElement): boolean {
	// Filter out elements that are hidden or have display: none
	if (element.offsetParent === null && element.style.position !== 'fixed') {
		return false;
	}

	// Filter out elements with visibility: hidden
	return getComputedStyle(element).visibility !== 'hidden';
}

/**
 * Collect focusable elements under `root` in composed-tree order.
 *
 * `querySelectorAll` stops at shadow boundaries, so a focusable control that
 * lives inside a nested component's shadow root (`<ml-input>`, `<ml-button>`,
 * `<ml-select>`…) was invisible to it.
 */
function collectDeep(root: Element | ShadowRoot, out: HTMLElement[]): void {
	for (const child of Array.from(root.children)) {
		if (child instanceof HTMLSlotElement) {
			const assigned = child.assignedElements({ flatten: true });
			if (assigned.length > 0) {
				for (const element of assigned) {
					visitDeep(element, out);
				}
			} else {
				// Fallback content
				collectDeep(child, out);
			}
			continue;
		}

		visitDeep(child, out);
	}
}

function visitDeep(element: Element, out: HTMLElement[]): void {
	if (element instanceof HTMLElement && element.matches(FOCUSABLE_SELECTOR) && isVisiblyFocusable(element)) {
		out.push(element);
	}

	// A shadow host renders its shadow tree; its light children only appear
	// where a <slot> projects them, which collectDeep follows.
	collectDeep(element.shadowRoot ?? element, out);
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement, options: GetFocusableOptions = {}): HTMLElement[] {
	if (options.deep) {
		const focusables: HTMLElement[] = [];
		collectDeep(container.shadowRoot ?? container, focusables);
		return focusables;
	}

	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisiblyFocusable);
}

/**
 * Get the first focusable element within a container
 */
export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
	const elements = getFocusableElements(container);
	return elements[0] ?? null;
}

/**
 * Get the last focusable element within a container
 */
export function getLastFocusable(container: HTMLElement): HTMLElement | null {
	const elements = getFocusableElements(container);
	return elements[elements.length - 1] ?? null;
}

/**
 * Focus the first focusable element within a container
 */
export function focusFirst(container: HTMLElement): boolean {
	const first = getFirstFocusable(container);
	if (first) {
		first.focus();
		return true;
	}
	return false;
}

/**
 * Focus the last focusable element within a container
 */
export function focusLast(container: HTMLElement): boolean {
	const last = getLastFocusable(container);
	if (last) {
		last.focus();
		return true;
	}
	return false;
}

/**
 * Check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
	return element.matches(FOCUSABLE_SELECTOR) && element.offsetParent !== null;
}
