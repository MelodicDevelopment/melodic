import type { UniqueID } from '../../../functions';
import type { IDialogConfig } from './dialog-config.interface';

export class DialogRef<TResult = unknown, TData = unknown> {
	private _afterOpenedCallback: (() => void) | null = null;
	private _afterClosedCallback: ((result: TResult | undefined) => void) | null = null;
	private _data: TData | undefined;
	private _disableClose = false;
	private readonly _handleCancel = this.onCancel.bind(this);

	constructor(
		private readonly _dialogID: UniqueID,
		private readonly _dialogEl: HTMLDialogElement
	) {
		this._dialogEl.addEventListener('cancel', this._handleCancel);
	}

	get dialogID(): UniqueID {
		return this._dialogID;
	}

	get data(): TData | undefined {
		return this._data;
	}

	get disableClose(): boolean {
		return this._disableClose;
	}

	applyConfig(config: IDialogConfig<TData>): this {
		if (config.data !== undefined) {
			this._data = config.data;
		}

		if (config.disableClose !== undefined) {
			this._disableClose = config.disableClose;
		}

		if (config.size && config.size !== 'auto') {
			this._dialogEl.classList.add(`ml-dialog--${config.size}`);
		}

		if (config.width) {
			this._dialogEl.style.maxWidth = config.width;
		}

		if (config.panelClass) {
			const classes = Array.isArray(config.panelClass) ? config.panelClass : [config.panelClass];
			this._dialogEl.classList.add(...classes);
		}

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

	private onCancel(event: Event): void {
		if (this._disableClose) {
			event.preventDefault();
		}
	}
}
