/**
 * Guard against the trigger click that just light-dismissed an open overlay
 * immediately reopening it (popover, dropdown).
 *
 * With the Popover API, clicking the trigger of an open light-dismiss overlay
 * fires the dismissal first (pointerdown outside the popover) and THEN the
 * trigger's click handler — which would toggle the overlay straight back
 * open. Components call `dismissed()` from their close path and gate their
 * toggle handler on `shouldSkipToggle()`, which consumes the guard.
 *
 * The guard self-clears on the next macrotask, so it only ever swallows the
 * click belonging to the dismissal itself.
 */
export class ToggleDismissGuard {
	private _justDismissed = false;

	/** Record that the overlay just light-dismissed. */
	public dismissed(): void {
		this._justDismissed = true;
		setTimeout(() => {
			this._justDismissed = false;
		}, 0);
	}

	/**
	 * True when the current toggle should be swallowed (the trigger click that
	 * caused the dismissal). Consumes the guard.
	 */
	public shouldSkipToggle(): boolean {
		if (this._justDismissed) {
			this._justDismissed = false;
			return true;
		}
		return false;
	}
}
