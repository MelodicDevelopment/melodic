import { Injectable } from '@melodicdev/core';
import type { UniqueID } from '../../../functions/new-id.function';
import { DialogRef } from './dialog-ref.class';
import type { DialogComponentLoader } from './dialog-loader.type';
import type { ComponentBase } from '@melodicdev/core';
import type { IDialogRef } from './idialog-ref.interface';

interface IDialogComponentElement<T = unknown> extends HTMLElement {
	component: ComponentBase & Partial<IDialogRef<T>>;
}

@Injectable()
export class DialogService {
	private readonly _dialogs = new Map<UniqueID, DialogRef>();

	addDialog(dialogID: UniqueID, dialogEl: HTMLDialogElement): DialogRef {
		const dialogRef = new DialogRef(dialogID, dialogEl, this);
		this._dialogs.set(dialogID, dialogRef);

		return dialogRef;
	}

	removeDialog(dialogID: UniqueID): void {
		this._dialogs.delete(dialogID);
	}

	open(dialogComponentOrID: UniqueID | DialogComponentLoader): DialogRef {
		let dialogID: UniqueID;
		let dialogRef: DialogRef;

		if (typeof dialogComponentOrID === 'string') {
			dialogID = dialogComponentOrID;
			dialogRef = this._dialogs.get(dialogID)!;
		} else {
			const dialogComponent: HTMLElement = this.mountDialog(dialogComponentOrID);
			const mlDialogEl: HTMLElement = dialogComponent.shadowRoot?.querySelector('ml-dialog') as HTMLElement;
			const dialogEl: HTMLDialogElement = mlDialogEl.shadowRoot?.querySelector('dialog') as HTMLDialogElement;

			dialogID = dialogEl.id as UniqueID;
			dialogRef = new DialogRef(dialogID, dialogEl, this);

			(dialogComponent as IDialogComponentElement).component.onDialogRefSet?.(dialogRef);
		}

		dialogRef!.open();

		return dialogRef;
	}

	close(dialogID: UniqueID): void {
		if (this._dialogs.has(dialogID)) {
			const dialogRef: DialogRef | undefined = this._dialogs.get(dialogID);
			dialogRef!.close();
		}
	}

	private mountDialog(component: DialogComponentLoader): HTMLElement {
		const dialogElement = document.createElement(component.selector);
		document.body.appendChild(dialogElement);
		return dialogElement;
	}
}
