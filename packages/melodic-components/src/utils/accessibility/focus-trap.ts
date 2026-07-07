import { getFocusableElements } from './focus-utils.js';

export interface FocusTrapOptions {
	/** Element to focus when trap is activated */
	initialFocus?: HTMLElement | null;
	/** Element to return focus to when trap is deactivated */
	returnFocus?: HTMLElement | null;
	/** Whether to auto-focus first element if initialFocus not provided */
	autoFocus?: boolean;
}

export interface FocusTrapDeactivateOptions {
	/** Whether to restore focus to the previously-focused element (default: true) */
	returnFocus?: boolean;
}

export interface FocusTrap {
	activate(): void;
	deactivate(options?: FocusTrapDeactivateOptions): void;
	isActive(): boolean;
}

/**
 * The element that actually has focus, descending through nested shadow roots.
 * `document.activeElement` alone reports the outermost shadow host.
 */
export function getDeepActiveElement(): Element | null {
	let active: Element | null = document.activeElement;
	while (active?.shadowRoot?.activeElement) {
		active = active.shadowRoot.activeElement;
	}
	return active;
}

/**
 * True when the (deep) focused element is `container` or lives inside it,
 * crossing shadow boundaries in both directions: the active element is
 * resolved through nested shadow roots, and the ancestor walk climbs from
 * shadow roots to their hosts. Overlays use this to decide whether a
 * dismissal happened while focus was parked in their content (and therefore
 * whether focus should be returned to the trigger).
 */
export function isDeepFocusWithin(container: Node): boolean {
	let node: Node | null = getDeepActiveElement();
	while (node) {
		if (node === container) return true;
		node = node instanceof ShadowRoot ? node.host : node.parentNode;
	}
	return false;
}

/**
 * Collect focusable elements within a container, expanding `<slot>` elements
 * to their assigned (light DOM) content so traps work on shadow containers
 * that project slotted content.
 */
function collectFocusables(container: HTMLElement): HTMLElement[] {
	const slots = Array.from(container.querySelectorAll('slot'));
	if (slots.length === 0) {
		return getFocusableElements(container);
	}

	const focusables = getFocusableElements(container);
	for (const slot of slots) {
		for (const assigned of slot.assignedElements({ flatten: true })) {
			if (assigned instanceof HTMLElement) {
				focusables.push(...getFocusableElements(assigned));
				if (assigned.matches('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')) {
					focusables.push(assigned);
				}
			}
		}
	}

	return focusables;
}

/**
 * Create a focus trap within a container element
 */
export function createFocusTrap(container: HTMLElement, options: FocusTrapOptions = {}): FocusTrap {
	const { initialFocus = null, returnFocus = null, autoFocus = true } = options;

	let active = false;
	let previouslyFocused: HTMLElement | null = null;

	// When the container lives in a shadow root, keydown events from slotted
	// (light DOM) content bubble through the host element's tree; listen there
	// too so projected content is trapped.
	const containerRoot = container.getRootNode();
	const hostEl: HTMLElement | null = containerRoot instanceof ShadowRoot ? (containerRoot.host as HTMLElement) : null;
	const handledEvents = new WeakSet<Event>();

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key !== 'Tab' || !active) return;
		// The same event can reach both the container and the host listener.
		if (handledEvents.has(event)) return;
		handledEvents.add(event);

		const focusables = collectFocusables(container);
		if (focusables.length === 0) return;

		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		// document.activeElement is always the outer shadow host for content
		// inside shadow DOM; resolve the deep active element instead.
		const activeElement = getDeepActiveElement();

		if (event.shiftKey) {
			// Shift + Tab: going backwards
			if (activeElement === first) {
				event.preventDefault();
				last.focus();
			}
		} else {
			// Tab: going forwards
			if (activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	}

	function activate(): void {
		if (active) return;

		active = true;
		previouslyFocused = getDeepActiveElement() as HTMLElement | null;

		// Add keydown listeners
		container.addEventListener('keydown', handleKeydown);
		hostEl?.addEventListener('keydown', handleKeydown);

		// Focus initial element
		if (initialFocus) {
			initialFocus.focus();
		} else if (autoFocus) {
			const first = collectFocusables(container)[0];
			if (first) {
				first.focus();
			}
		}
	}

	function deactivate(deactivateOptions: FocusTrapDeactivateOptions = {}): void {
		if (!active) return;

		active = false;
		container.removeEventListener('keydown', handleKeydown);
		hostEl?.removeEventListener('keydown', handleKeydown);

		// Return focus
		if (deactivateOptions.returnFocus === false) {
			return;
		}

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
