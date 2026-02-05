import { Injectable } from '@melodicdev/core';
import type { UniqueID } from '../../../functions/new-id.function';
import { DialogRef } from './dialog-ref.class';
import type { DialogComponentLoader } from './dialog-loader.type';
import type { ComponentBase } from '@melodicdev/core';
import type { IDialogRef } from './idialog-ref.interface';

interface IDialogComponentElement<T = unknown> extends HTMLElement {
	component: ComponentBase & Partial<IDialogRef<T>>;
}

interface IDialogElements<T = unknown> {
	dialogRef: DialogRef<T>;
	dialogComponent?: IDialogComponentElement<T>;
}

@Injectable()
export class DialogService {
	private readonly _dialogs = new Map<UniqueID, IDialogElements>();

	addDialog(dialogID: UniqueID, dialogEl: HTMLDialogElement): DialogRef {
		const dialogRef = new DialogRef(dialogID, dialogEl);
		this._dialogs.set(dialogID, {
			dialogRef,
			dialogComponent: undefined
		});

		dialogEl.addEventListener('ml:dialog-close', () => {
			const elements = this._dialogs.get(dialogID);
			this.cleanUpDialog(dialogID, elements?.dialogComponent);
		});

		return dialogRef;
	}

	removeDialog(dialogID: UniqueID): void {
		this._dialogs.delete(dialogID);
	}

	open(dialogComponentOrID: UniqueID | DialogComponentLoader): DialogRef {
		let dialogID: UniqueID = dialogComponentOrID as UniqueID;
		let dialogElements: IDialogElements = this._dialogs.get(dialogID)!;

		if (typeof dialogComponentOrID !== 'string') {
			const dialogComponent: HTMLElement = this.mountDialog(dialogComponentOrID);
			const mlDialogEl: HTMLElement = dialogComponent.shadowRoot?.querySelector('ml-dialog') as HTMLElement;
			const dialogEl: HTMLDialogElement = mlDialogEl.shadowRoot?.querySelector('dialog') as HTMLDialogElement;

			dialogID = dialogEl.id as UniqueID;
			dialogElements = this._dialogs.get(dialogID)!;

			dialogElements.dialogComponent = dialogComponent as IDialogComponentElement;
			(dialogComponent as IDialogComponentElement).component.onDialogRefSet?.(dialogElements.dialogRef);
		}

		dialogElements.dialogRef.open();

		return dialogElements.dialogRef;
	}

	close<T = unknown>(dialogID: UniqueID, result?: T): void {
		if (this._dialogs.has(dialogID)) {
			const dialogElements: IDialogElements = this._dialogs.get(dialogID)!;
			dialogElements.dialogRef.close(result);
		}
	}

	private cleanUpDialog(dialogID: UniqueID, dialogComponent?: IDialogComponentElement<unknown>): void {
		if (dialogComponent) {
			this.unmountDialog(dialogComponent);
		}

		this.removeDialog(dialogID);
	}

	private mountDialog(component: DialogComponentLoader): HTMLElement {
		const dialogElement = document.createElement(component.selector);
		document.body.appendChild(dialogElement);
		return dialogElement;
	}

	private unmountDialog(component: HTMLElement): void {
		component.remove();
	}
}
