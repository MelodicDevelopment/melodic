import { getFocusableElements, getFirstFocusable, getLastFocusable } from './focus-utils.js';

export interface FocusTrapOptions {
	/** Element to focus when trap is activated */
	initialFocus?: HTMLElement | null;
	/** Element to return focus to when trap is deactivated */
	returnFocus?: HTMLElement | null;
	/** Whether to auto-focus first element if initialFocus not provided */
	autoFocus?: boolean;
}

export interface FocusTrap {
	activate(): void;
	deactivate(): void;
	isActive(): boolean;
}

/**
 * Create a focus trap within a container element
 */
export function createFocusTrap(container: HTMLElement, options: FocusTrapOptions = {}): FocusTrap {
	const { initialFocus = null, returnFocus = null, autoFocus = true } = options;

	let active = false;
	let previouslyFocused: HTMLElement | null = null;

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key !== 'Tab' || !active) return;

		const focusables = getFocusableElements(container);
		if (focusables.length === 0) return;

		const first = focusables[0];
		const last = focusables[focusables.length - 1];

		if (event.shiftKey) {
			// Shift + Tab: going backwards
			if (document.activeElement === first) {
				event.preventDefault();
				last.focus();
			}
		} else {
			// Tab: going forwards
			if (document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	}

	function activate(): void {
		if (active) return;

		active = true;
		previouslyFocused = document.activeElement as HTMLElement;

		// Add keydown listener
		container.addEventListener('keydown', handleKeydown);

		// Focus initial element
		if (initialFocus) {
			initialFocus.focus();
		} else if (autoFocus) {
			const first = getFirstFocusable(container);
			if (first) {
				first.focus();
			}
		}
	}

	function deactivate(): void {
		if (!active) return;

		active = false;
		container.removeEventListener('keydown', handleKeydown);

		// Return focus
		const focusTarget = returnFocus ?? previouslyFocused;
		if (focusTarget && typeof focusTarget.focus === 'function') {
			focusTarget.focus();
		}
	}

	function isActive(): boolean {
		return active;
	}

	return { activate, deactivate, isActive };
}

/**
 * Simple focus trap function for one-off use
 */
export function focusTrap(container: HTMLElement, options?: FocusTrapOptions): () => void {
	const trap = createFocusTrap(container, options);
	trap.activate();
	return () => trap.deactivate();
}
