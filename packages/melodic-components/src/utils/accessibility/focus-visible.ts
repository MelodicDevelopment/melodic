let hadKeyboardEvent = false;
let isInitialized = false;

/**
 * Initialize focus-visible detection
 * Tracks whether the last interaction was keyboard or mouse
 */
function initFocusVisible(): void {
	if (isInitialized) return;
	isInitialized = true;

	document.addEventListener(
		'keydown',
		() => {
			hadKeyboardEvent = true;
		},
		true
	);

	document.addEventListener(
		'mousedown',
		() => {
			hadKeyboardEvent = false;
		},
		true
	);

	document.addEventListener(
		'pointerdown',
		() => {
			hadKeyboardEvent = false;
		},
		true
	);
}

/**
 * Check if the current focus should show a visible focus ring
 * Returns true if the last interaction was keyboard-based
 */
export function isFocusVisible(): boolean {
	initFocusVisible();
	return hadKeyboardEvent;
}

/**
 * Add focus-visible class to an element when focused via keyboard
 */
export function focusVisible(element: HTMLElement, className = 'focus-visible'): () => void {
	initFocusVisible();

	function handleFocus(): void {
		if (hadKeyboardEvent) {
			element.classList.add(className);
		}
	}

	function handleBlur(): void {
		element.classList.remove(className);
	}

	element.addEventListener('focus', handleFocus);
	element.addEventListener('blur', handleBlur);

	return () => {
		element.removeEventListener('focus', handleFocus);
		element.removeEventListener('blur', handleBlur);
		element.classList.remove(className);
	};
}
