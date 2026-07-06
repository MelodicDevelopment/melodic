type AnnouncePriority = 'polite' | 'assertive';

/** Delay before writing a message so screen readers register the clear/set cycle. */
const CLEAR_DELAY_MS = 50;
/** Minimum time a message stays in the region before the next queued one replaces it. */
const MESSAGE_GAP_MS = 150;

interface LiveRegionState {
	element: HTMLElement | null;
	queue: string[];
	flushing: boolean;
}

const regions: Record<AnnouncePriority, LiveRegionState> = {
	polite: { element: null, queue: [], flushing: false },
	assertive: { element: null, queue: [], flushing: false }
};

function applyVisuallyHiddenStyles(element: HTMLElement): void {
	// Visually hidden but accessible to screen readers
	Object.assign(element.style, {
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
}

/**
 * Get or create the global live region element for a politeness level.
 * Each level has its own region so assertive announcements can't clobber
 * polite ones (and vice versa).
 */
function getLiveRegion(priority: AnnouncePriority): HTMLElement {
	const state = regions[priority];
	if (state.element && document.body.contains(state.element)) {
		return state.element;
	}

	const region = document.createElement('div');
	// The polite region keeps the historical id for backwards compatibility.
	region.id = priority === 'polite' ? 'ml-live-region' : 'ml-live-region-assertive';
	region.setAttribute('aria-live', priority);
	region.setAttribute('aria-atomic', 'true');
	region.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
	applyVisuallyHiddenStyles(region);

	document.body.appendChild(region);
	state.element = region;
	return region;
}

/**
 * Drain the queue for one politeness level, one message at a time. Each
 * message gets a clear → (delay) → set cycle so screen readers re-announce
 * identical consecutive messages, and stays in the region for a minimum gap
 * before the next queued message replaces it — rapid successive calls are
 * announced in order instead of overwriting each other.
 */
function flushQueue(priority: AnnouncePriority): void {
	const state = regions[priority];
	const message = state.queue.shift();

	if (message === undefined) {
		state.flushing = false;
		return;
	}

	state.flushing = true;
	const region = getLiveRegion(priority);

	// Clear and set message (screen readers need this pattern to re-announce)
	region.textContent = '';

	setTimeout(() => {
		region.textContent = message;
		setTimeout(() => flushQueue(priority), MESSAGE_GAP_MS);
	}, CLEAR_DELAY_MS);
}

/**
 * Announce a message to screen readers.
 *
 * Messages are queued per politeness level, so rapid successive calls are
 * announced one after another instead of the last call silently cancelling
 * the earlier ones.
 *
 * @param message - The message to announce
 * @param priority - 'polite' waits for silence, 'assertive' interrupts
 */
export function announce(message: string, priority: AnnouncePriority = 'polite'): void {
	const state = regions[priority];
	state.queue.push(message);

	if (!state.flushing) {
		flushQueue(priority);
	}
}

/**
 * Create a custom live region with specific options
 */
export function createLiveRegion(options: { id?: string; priority?: AnnouncePriority; atomic?: boolean } = {}): HTMLElement {
	const { id, priority = 'polite', atomic = true } = options;

	const region = document.createElement('div');
	if (id) region.id = id;
	region.setAttribute('aria-live', priority);
	region.setAttribute('aria-atomic', atomic.toString());
	region.setAttribute('role', 'status');
	applyVisuallyHiddenStyles(region);

	return region;
}
