/**
 * Minimal Popover API polyfill for happy-dom test runs.
 *
 * happy-dom does not implement showPopover/hidePopover/togglePopover or the
 * `toggle` event. Components built on the Popover API (select, autocomplete,
 * date-picker, ...) need these to open/close in tests. The polyfill tracks
 * open state per element and dispatches a `toggle` event with
 * `newState`/`oldState`, matching how the components consume ToggleEvent.
 */
export function installPopoverPolyfill(): void {
	const proto = HTMLElement.prototype as any;
	if (typeof proto.showPopover === 'function') return;

	const openState = new WeakSet<HTMLElement>();

	function dispatchToggle(el: HTMLElement, newState: 'open' | 'closed'): void {
		const event = new Event('toggle');
		(event as any).newState = newState;
		(event as any).oldState = newState === 'open' ? 'closed' : 'open';
		el.dispatchEvent(event);
	}

	proto.showPopover = function (this: HTMLElement): void {
		if (openState.has(this)) return;
		openState.add(this);
		dispatchToggle(this, 'open');
	};

	proto.hidePopover = function (this: HTMLElement): void {
		if (!openState.has(this)) return;
		openState.delete(this);
		dispatchToggle(this, 'closed');
	};

	proto.togglePopover = function (this: HTMLElement): void {
		if (openState.has(this)) {
			this.hidePopover();
		} else {
			this.showPopover();
		}
	};
}
