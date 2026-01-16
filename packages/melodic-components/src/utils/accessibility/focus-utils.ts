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

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
	const elements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

	return elements.filter((element) => {
		// Filter out elements that are hidden or have display: none
		if (element.offsetParent === null && element.style.position !== 'fixed') {
			return false;
		}

		// Filter out elements with visibility: hidden
		const style = getComputedStyle(element);
		if (style.visibility === 'hidden') {
			return false;
		}

		return true;
	});
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
