/**
 * Watch the light DOM for which named slots have content.
 *
 * `watchSlotPresence` listens on the shadow `<slot>` elements, which only
 * works when those slots are always rendered. A component that renders a slot
 * conditionally (`${when(hasSearch, …)}`) has a chicken-and-egg problem: the
 * slot that would fire `slotchange` exists only once the flag is already true,
 * so content slotted after mount never appears at all.
 *
 * Only direct children participate in slot projection, but a `slot` attribute
 * change on a child is observable only with `subtree: true` — so the subtree is
 * observed and the mutations are filtered down to the ones that can actually
 * change projection. Deep mutations inside slotted content are ignored.
 *
 * Returns a disconnect function; call it from `onDestroy`.
 */
export function watchLightSlots(host: HTMLElement, onChange: () => void): () => void {
	const observer = new MutationObserver((mutations) => {
		const relevant = mutations.some((mutation) =>
			mutation.type === 'childList' ? mutation.target === host : mutation.target.parentNode === host
		);

		if (relevant) {
			onChange();
		}
	});

	observer.observe(host, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['slot']
	});

	onChange();

	return () => observer.disconnect();
}

/** True when `host` has a direct child assigned to `slotName`. */
export function hasLightSlot(host: HTMLElement, slotName: string): boolean {
	return host.querySelector(`:scope > [slot="${slotName}"]`) !== null;
}
