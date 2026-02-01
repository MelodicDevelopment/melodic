import { Injectable } from '@melodicdev/core';
import type { UniqueID } from '../../../functions/new-id.function';

@Injectable()
export class DialogService {
	private readonly _dialogs = new Map<UniqueID, HTMLDialogElement>();

	addDialog(dialogID: UniqueID, dialogRef: HTMLDialogElement): void {
		this._dialogs.set(dialogID, dialogRef);
	}

	removeDialog(dialogID: UniqueID): void {
		this._dialogs.delete(dialogID);
	}

	open(dialogID: UniqueID): void {
		if (this._dialogs.has(dialogID)) {
			const dialogRef: HTMLDialogElement | undefined = this._dialogs.get(dialogID);
			dialogRef!.showModal();
		}
	}

	close(dialogID: UniqueID): void {
		if (this._dialogs.has(dialogID)) {
			const dialogRef: HTMLDialogElement | undefined = this._dialogs.get(dialogID);
			dialogRef!.close();
		}
	}
}
