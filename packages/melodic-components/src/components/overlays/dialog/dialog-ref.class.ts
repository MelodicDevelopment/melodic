import type { UniqueID } from '../../../functions';

export class DialogRef<TResult = unknown, TData = unknown> {
	private _afterOpenedCallback: (() => void) | null = null;
	private _afterClosedCallback: ((result: TResult | undefined) => void) | null = null;
	private _data: TData | undefined;

	constructor(
		private readonly _dialogID: UniqueID,
		private readonly _dialogEl: HTMLDialogElement
	) {}

	get dialogID(): UniqueID {
		return this._dialogID;
	}

	get data(): TData | undefined {
		return this._data;
	}

	setData(data: TData): this {
		this._data = data;
		return this;
	}

	open(): void {
		this._dialogEl.showModal();
		this._afterOpenedCallback?.();
	}

	close(result?: TResult): void {
		this._dialogEl.close();
		this._afterClosedCallback?.(result);
	}

	afterOpened(callback: () => void): void {
		this._afterOpenedCallback = callback;
	}

	afterClosed(callback: (result: TResult | undefined) => void): void {
		this._afterClosedCallback = callback;
	}
}
