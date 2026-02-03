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
	public dialogRef!: DialogRef;

	close(): void {
		this.dialogRef.close();
	}
}
