/**
 * Options for auto-update behavior
 */
export interface AutoUpdateOptions {
	/** Update on ancestor scroll events (default: true) */
	ancestorScroll?: boolean;
	/** Update on ancestor resize events (default: true) */
	ancestorResize?: boolean;
	/** Update on element resize events (default: true) */
	elementResize?: boolean;
	/** Update on layout shift / animation frames (default: false) */
	animationFrame?: boolean;
}

/**
 * Get all scrollable ancestor elements
 */
function getScrollAncestors(element: Element): Element[] {
	const ancestors: Element[] = [];
	let node: Node | null = element;

	while (node) {
		const parent: Node | null = node.parentNode;

		if (parent instanceof ShadowRoot) {
			// Cross shadow DOM boundary — continue from the host element
			node = parent.host;
			continue;
		}

		if (parent instanceof Element) {
			const { overflow, overflowX, overflowY } = getComputedStyle(parent);
			if (/auto|scroll|overlay|hidden/.test(overflow + overflowX + overflowY)) {
				ancestors.push(parent);
			}
			node = parent;
		} else {
			break;
		}
	}

	return ancestors;
}

/**
 * Automatically update floating element position on scroll, resize, etc.
 * Returns a cleanup function to stop watching.
 */
export function autoUpdate(reference: Element, floating: HTMLElement, update: () => void, options: AutoUpdateOptions = {}): () => void {
	const { ancestorScroll = true, ancestorResize = true, elementResize = true, animationFrame = false } = options;

	const cleanups: (() => void)[] = [];

	// Update on scroll (ancestors + window for viewport scroll)
	if (ancestorScroll) {
		const ancestors = getScrollAncestors(reference);
		for (const ancestor of ancestors) {
			ancestor.addEventListener('scroll', update, { passive: true });
			cleanups.push(() => ancestor.removeEventListener('scroll', update));
		}
		window.addEventListener('scroll', update, { passive: true });
		cleanups.push(() => window.removeEventListener('scroll', update));
	}

	// Update on window resize
	if (ancestorResize) {
		window.addEventListener('resize', update);
		cleanups.push(() => window.removeEventListener('resize', update));
	}

	// Update on element resize using ResizeObserver
	if (elementResize && typeof ResizeObserver !== 'undefined') {
		const observer = new ResizeObserver(() => {
			update();
		});
		observer.observe(reference);
		observer.observe(floating);
		cleanups.push(() => observer.disconnect());
	}

	// Update on animation frame (for animations/transitions)
	if (animationFrame) {
		let frameId: number;
		const frameLoop = () => {
			update();
			frameId = requestAnimationFrame(frameLoop);
		};
		frameId = requestAnimationFrame(frameLoop);
		cleanups.push(() => cancelAnimationFrame(frameId));
	}

	// Return cleanup function
	return () => {
		cleanups.forEach((fn) => fn());
	};
}
