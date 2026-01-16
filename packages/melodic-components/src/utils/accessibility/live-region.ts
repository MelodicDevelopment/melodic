let liveRegion: HTMLElement | null = null;

/**
 * Get or create the global live region element
 */
function getLiveRegion(): HTMLElement {
	if (liveRegion && document.body.contains(liveRegion)) {
		return liveRegion;
	}

	liveRegion = document.createElement('div');
	liveRegion.id = 'ml-live-region';
	liveRegion.setAttribute('aria-live', 'polite');
	liveRegion.setAttribute('aria-atomic', 'true');
	liveRegion.setAttribute('role', 'status');

	// Visually hidden but accessible to screen readers
	Object.assign(liveRegion.style, {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: '0',
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap',
		border: '0'
	});

	document.body.appendChild(liveRegion);
	return liveRegion;
}

/**
 * Announce a message to screen readers
 * @param message - The message to announce
 * @param priority - 'polite' waits for silence, 'assertive' interrupts
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
	const region = getLiveRegion();
	region.setAttribute('aria-live', priority);

	// Clear and set message (screen readers need this pattern to re-announce)
	region.textContent = '';

	// Use setTimeout to ensure the clear is processed first
	setTimeout(() => {
		region.textContent = message;
	}, 50);
}

/**
 * Create a custom live region with specific options
 */
export function createLiveRegion(options: { id?: string; priority?: 'polite' | 'assertive'; atomic?: boolean } = {}): HTMLElement {
	const { id, priority = 'polite', atomic = true } = options;

	const region = document.createElement('div');
	if (id) region.id = id;
	region.setAttribute('aria-live', priority);
	region.setAttribute('aria-atomic', atomic.toString());
	region.setAttribute('role', 'status');

	// Visually hidden
	Object.assign(region.style, {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: '0',
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap',
		border: '0'
	});

	return region;
}
