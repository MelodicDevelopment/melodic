import type { UniqueID } from '../../../functions';
import type { DialogService } from './dialog.service';

export class DialogRef<T = unknown> {
	private _afterOpenedCallback: (() => void) | null = null;
	private _afterClosedCallback: ((result: T | undefined) => void) | null = null;

	constructor(
		private readonly _dialogID: UniqueID,
		private readonly _dialogEl: HTMLDialogElement,
		private readonly _dialogService: DialogService
	) {}

	open(): void {
		this._dialogEl.showModal();
		this._afterOpenedCallback?.();
	}

	close(result?: T): void {
		this._dialogEl.close(JSON.stringify(result));
		this._dialogService.removeDialog(this._dialogID);
		this._afterClosedCallback?.(result);
	}

	afterOpened(callback: () => void): void {
		this._afterOpenedCallback = callback;
	}

	afterClosed(callback: (result: T | undefined) => void): void {
		this._afterClosedCallback = callback;
	}
}
