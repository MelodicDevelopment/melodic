import { Injectable } from '@melodicdev/core';
import type { UniqueID } from '../../../functions/new-id.function';
import type { IDialogConfig } from './dialog-config.interface';
import { DialogRef } from './dialog-ref.class';
import type { DialogComponentLoader } from './dialog-loader.type';

@Injectable()
export class DialogService {
	private readonly _dialogs = new Map<UniqueID, HTMLDialogElement>();

	addDialog(dialogID: UniqueID, dialogRef: HTMLDialogElement): void {
		this._dialogs.set(dialogID, dialogRef);
	}

	removeDialog(dialogID: UniqueID): void {
		this._dialogs.delete(dialogID);
	}

	open(dialogComponentOrID: UniqueID | DialogComponentLoader, config?: IDialogConfig): DialogRef {
		let dialogID: UniqueID;
		let dialogRef: DialogRef;

		if (typeof dialogComponentOrID === 'string') {
			dialogID = dialogComponentOrID;
			dialogRef = new DialogRef(dialogComponentOrID);
		} else {
			const dialogComponent: HTMLElement = this.mountDialog(dialogComponentOrID);
			const dialogEl: HTMLDialogElement = dialogComponent.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
			dialogID = dialogEl.id as UniqueID;

			this.addDialog(dialogID, dialogEl);

			dialogRef = new DialogRef(dialogID);
		}

		if (this._dialogs.has(dialogID)) {
			const dialogRef: HTMLDialogElement | undefined = this._dialogs.get(dialogID);
			dialogRef!.showModal();
		}

		return dialogRef;
	}

	close(dialogID: UniqueID): void {
		if (this._dialogs.has(dialogID)) {
			const dialogRef: HTMLDialogElement | undefined = this._dialogs.get(dialogID);
			dialogRef!.close();
		}
	}

	private mountDialog(component: DialogComponentLoader): HTMLElement {
		const dialogElement = document.createElement(component.selector);
		document.body.appendChild(dialogElement);
		return dialogElement;
	}
}
