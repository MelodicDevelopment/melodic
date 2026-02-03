import type { UniqueID } from '../../../functions';

export class DialogRef<T = unknown> {
	private _afterOpenedCallback: (() => void) | null = null;
	private _afterClosedCallback: ((result: T | undefined) => void) | null = null;

	constructor(
		private readonly _dialogID: UniqueID,
		private readonly _dialogEl: HTMLDialogElement
	) {}

	open(): void {
		this._dialogEl.showModal();
		this._afterOpenedCallback?.();
	}

	close(result?: T): void {
		this._dialogEl.close(JSON.stringify(result));
		this._afterClosedCallback?.(result);
	}

	afterOpened(callback: () => void): void {
		this._afterOpenedCallback = callback;
	}

	afterClosed(callback: (result: T | undefined) => void): void {
		this._afterClosedCallback = callback;
	}
}
