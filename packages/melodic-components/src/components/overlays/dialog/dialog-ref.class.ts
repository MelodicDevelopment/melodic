import type { UniqueID } from '../../../functions';

export class DialogRef<T = unknown> {
	private _afterOpenedCallback: (() => void) | null = null;
	private _afterClosedCallback: ((result: T | undefined) => void) | null = null;

	constructor(
		private readonly _dialogID: UniqueID,
		private readonly _dialogEl: HTMLDialogElement
	) {}

	get dialogID(): UniqueID {
		return this._dialogID;
	}

	open(): void {
		this._dialogEl.showModal();
		this._afterOpenedCallback?.();

		this._dialogEl.dispatchEvent(
			new CustomEvent('ml:dialog-open', {
				bubbles: true,
				composed: true
			})
		);
	}

	close(result?: T): void {
		this._dialogEl.close();
		this._afterClosedCallback?.(result);

		this._dialogEl.dispatchEvent(
			new CustomEvent('ml:dialog-close', {
				bubbles: true,
				composed: true,
				detail: { result }
			})
		);
	}

	afterOpened(callback: () => void): void {
		this._afterOpenedCallback = callback;
	}

	afterClosed(callback: (result: T | undefined) => void): void {
		this._afterClosedCallback = callback;
	}
}
