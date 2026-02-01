import type { ModalConfig } from './modal.types';

/**
 * Reference to an open modal instance.
 * Provides methods to control the modal and access passed data.
 */
export class ModalRef<TData = unknown, TResult = unknown> {
	/** Unique identifier for this modal instance */
	readonly id: string;

	/** Data passed when opening the modal */
	readonly data: TData;

	/** Configuration options for this modal */
	readonly config: ModalConfig;

	private _resolveClose!: (result: TResult | undefined) => void;
	private _afterClosedPromise: Promise<TResult | undefined>;
	private _closeCallback?: (ref: ModalRef<TData, TResult>) => void;

	constructor(id: string, data: TData, config: ModalConfig) {
		this.id = id;
		this.data = data;
		this.config = config;

		this._afterClosedPromise = new Promise((resolve) => {
			this._resolveClose = resolve;
		});
	}

	/**
	 * Register callback to be called when close() is invoked
	 * @internal
	 */
	_setCloseCallback(callback: (ref: ModalRef<TData, TResult>) => void): void {
		this._closeCallback = callback;
	}

	/**
	 * Close the modal with an optional result
	 */
	close(result?: TResult): void {
		this._resolveClose(result);
		this._closeCallback?.(this);
	}

	/**
	 * Returns a promise that resolves when the modal is closed
	 */
	afterClosed(): Promise<TResult | undefined> {
		return this._afterClosedPromise;
	}
}
