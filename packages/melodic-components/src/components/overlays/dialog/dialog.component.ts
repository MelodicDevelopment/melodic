import { MelodicComponent, Service } from '@melodicdev/core';
import { dialogTemplate } from './dialog.template';
import { dialogStyles } from './dialog.styles';
import type { OnCreate, OnDestroy, IElementRef } from '@melodicdev/core';
import { newID, type UniqueID } from '../../../functions/new-id.function';
import { DialogService } from './dialog.service';

@MelodicComponent({
	selector: 'ml-dialog',
	template: dialogTemplate,
	styles: dialogStyles,
	attributes: []
})
export class DialogComponent implements IElementRef, OnCreate, OnDestroy {
	@Service(DialogService)
	private readonly _dialogService!: DialogService;

	private _dialogID: UniqueID = newID();

	public elementRef!: HTMLElement;
	public dialogEl!: HTMLDialogElement;

	onCreate(): void {
		this.dialogEl = this.elementRef.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
		this._dialogID = this.createDialogID();
		this.dialogEl.id = this._dialogID;

		this._dialogService.addDialog(this._dialogID, this.dialogEl);
	}

	onDestroy(): void {
		this._dialogService.removeDialog(this._dialogID);
	}

	open(): void {
		this.dialogEl.showModal();
	}

	close(): void {
		this.dialogEl.close();
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
