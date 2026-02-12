import { MelodicComponent, html } from '@melodicdev/core';
import { type DialogRef, type IDialogRef } from '@melodicdev/components';

@MelodicComponent({
	selector: 'confirm-dialog',
	template: (c: ConfirmDialog) =>
		html` <ml-dialog>
			<div slot="dialog-header">Dialog Header</div>
			<p>Dialog content goes here</p>
			<div slot="dialog-footer">
				<ml-button variant="outline" @click=${() => c.close()}>Cancel</ml-button>
			</div>
		</ml-dialog>`
})
export class ConfirmDialog implements IDialogRef {
	private _dialogRef!: DialogRef;

	onDialogRefSet(dialogRef: DialogRef): void {
		this._dialogRef = dialogRef;

		dialogRef.afterClosed((result) => {
			console.log('Dialog closed with result:', result);
		});

		console.log('DialogRef Data:', dialogRef.data);
	}

	close(): void {
		this._dialogRef.close();
	}
}
