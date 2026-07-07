/**
 * Detect clicks outside of an element
 * @param element - The element to watch
 * @param callback - Function to call when clicked outside
 * @returns Cleanup function to remove the listener
 */
export function clickOutside(element: HTMLElement, callback: (event: MouseEvent) => void): () => void {
	function handleClick(event: MouseEvent): void {
		// event.target is retargeted to the outer host at the document level, so
		// element.contains() misreports clicks INSIDE shadow-hosted content as
		// outside. composedPath() includes every node the event passed through,
		// across shadow boundaries.
		if (!event.composedPath().includes(element)) {
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
