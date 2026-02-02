import { MelodicComponent, html } from '@melodicdev/core';

@MelodicComponent({
	selector: 'confirm-dialog',
	template: () =>
		html` <ml-dialog #test-dialog>
			<div slot="dialog-header">Dialog Header</div>
			<p>Dialog content goes here</p>
			<div slot="dialog-footer">
				<ml-button variant="outline">Cancel</ml-button>
			</div>
		</ml-dialog>`
})
export class ConfirmDialog {}
