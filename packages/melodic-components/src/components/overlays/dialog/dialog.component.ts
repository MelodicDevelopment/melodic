import { MelodicComponent, Service } from '@melodicdev/core';
import { dialogTemplate } from './dialog.template';
import { dialogStyles } from './dialog.styles';
import type { OnCreate, OnDestroy, IElementRef } from '@melodicdev/core';
import { newID, type UniqueID } from '../../../functions/new-id.function';
import { DialogService } from './dialog.service';
import type { DialogRef } from './dialog-ref.class';

@MelodicComponent({
	selector: 'ml-dialog',
	template: dialogTemplate,
	styles: dialogStyles,
	attributes: []
})
export class DialogComponent implements IElementRef, OnCreate, OnDestroy {
	public elementRef!: HTMLElement;

	@Service(DialogService)
	private readonly _dialogService!: DialogService;

	private _dialogID: UniqueID = newID();
	private _dialogEl!: HTMLDialogElement;
	private _dialogRef!: DialogRef;

	onCreate(): void {
		this._dialogEl = this.elementRef.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
		this._dialogID = this.createDialogID();
		this._dialogEl.id = this._dialogID;

		this._dialogRef = this._dialogService.addDialog(this._dialogID, this._dialogEl);
	}

	onDestroy(): void {
		this._dialogService.removeDialog(this._dialogID);
	}

	open(): void {
		this._dialogRef.open();
	}

	close<T = unknown>(result?: T): void {
		this._dialogRef.close(result);
	}

	private createDialogID(): UniqueID {
		return (
			(this.elementRef
				.getAttributeNames()
				.find((attr) => attr.startsWith('#'))
				?.slice(1) as UniqueID) ?? this._dialogID
		);
	}
}
