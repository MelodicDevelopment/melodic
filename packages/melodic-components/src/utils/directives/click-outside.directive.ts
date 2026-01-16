/**
 * Detect clicks outside of an element
 * @param element - The element to watch
 * @param callback - Function to call when clicked outside
 * @returns Cleanup function to remove the listener
 */
export function clickOutside(element: HTMLElement, callback: (event: MouseEvent) => void): () => void {
	function handleClick(event: MouseEvent): void {
		const target = event.target as Node;

		// Check if click is outside the element
		if (!element.contains(target)) {
			callback(event);
		}
	}

	// Use capture phase to catch events before they bubble
	document.addEventListener('click', handleClick, true);

	return () => {
		document.removeEventListener('click', handleClick, true);
	};
}

/**
 * Directive-style click outside for use with Melodic templates
 */
export function createClickOutsideHandler(callback: (event: MouseEvent) => void): (element: HTMLElement) => () => void {
	return (element: HTMLElement) => clickOutside(element, callback);
}
