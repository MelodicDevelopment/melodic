/**
 * Watches every `<slot>` currently in a shadow root and reports whether each
 * has slotted content — immediately, and again on every `slotchange` — so
 * content added or removed after mount projects correctly instead of being
 * frozen at first render.
 *
 * Whitespace-only text nodes do not count as content. This matters for
 * default slots (`<my-el>   </my-el>` has no label); named slots only ever
 * receive elements, so they are unaffected.
 *
 * The callback receives the slot's name (`''` for the default slot) and its
 * presence. Slots rendered conditionally (not in the shadow root when this is
 * called) are not watched — components with conditional slots need a light
 * DOM MutationObserver instead (see ml-dashboard-page).
 */
export function watchSlotPresence(shadow: ShadowRoot, onChange: (slotName: string, hasContent: boolean) => void): void {
	shadow.querySelectorAll('slot').forEach((slot) => {
		const update = (): void => {
			const hasContent = slot
				.assignedNodes()
				.some((node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent ?? '').trim() !== '');
			onChange(slot.name, hasContent);
		};
		slot.addEventListener('slotchange', update);
		update();
	});
}
