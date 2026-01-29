/**
 * Injection token for accessing the dialog reference from within dialog content.
 * This is set on the dialog content element when created by the DialogService.
 */
export const ML_DIALOG_REF = Symbol('ML_DIALOG_REF');

/**
 * Reference to an open dialog instance.
 * Provides methods to control the dialog and observe its lifecycle.
 */
export class DialogRef<TResult = unknown> {
	/** Promise that resolves when dialog opens */
	private _afterOpenedPromise: Promise<void>;
	private _resolveOpened!: () => void;

	/** Promise that resolves when dialog closes */
	private _afterClosedPromise: Promise<TResult | undefined>;
	private _resolveClose!: (result: TResult | undefined) => void;

	/** Callback to notify service of close */
	private _closeCallback?: (ref: DialogRef<TResult>) => void;

	constructor(
		/** Unique ID for this dialog */
		public readonly id: string
	) {
		this._afterOpenedPromise = new Promise((resolve) => {
			this._resolveOpened = resolve;
		});

		this._afterClosedPromise = new Promise((resolve) => {
			this._resolveClose = resolve;
		});
	}

	/**
	 * Called by overlay when dialog has opened
	 * @internal
	 */
	_notifyOpened(): void {
		this._resolveOpened();
	}

	/**
	 * Register callback for when close() is called
	 * @internal
	 */
	_setCloseCallback(callback: (ref: DialogRef<TResult>) => void): void {
		this._closeCallback = callback;
	}

	/**
	 * Close the dialog with an optional result
	 */
	close(result?: TResult): void {
		this._resolveClose(result);
		this._closeCallback?.(this);
	}

	/**
	 * Returns a promise that resolves when the dialog has opened
	 */
	afterOpened(): Promise<void> {
		return this._afterOpenedPromise;
	}

	/**
	 * Returns a promise that resolves when the dialog is closed
	 */
	afterClosed(): Promise<TResult | undefined> {
		return this._afterClosedPromise;
	}
}
