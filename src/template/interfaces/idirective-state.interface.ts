/**
 * Optional contract for directive state objects (the value a directive's
 * render function returns and receives back on the next render).
 *
 * Directives may return any value, but directives that own nested rendered
 * content (nested templates, listeners, subscriptions) should implement
 * `__dispose` so the engine can release those resources when the directive's
 * content is discarded — on removal by a parent directive, on a binding
 * switching to a different directive/value type, and on host teardown.
 */
export interface IDirectiveState {
	/**
	 * Dispose resources owned by this state (recursively disposes nested part
	 * trees). Must be idempotent. Must NOT remove DOM nodes — the caller is
	 * responsible for node removal.
	 */
	__dispose?: () => void;

	/**
	 * Node directives that replace their container with a marker range (e.g.
	 * when/repeat/unsafeHTML) expose the markers so the engine can clear the
	 * DOM they rendered when the binding transitions away from the directive.
	 */
	startMarker?: Comment;
	endMarker?: Comment;
}
