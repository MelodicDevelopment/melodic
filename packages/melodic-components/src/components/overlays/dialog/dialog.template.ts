import { html } from '@melodicdev/core';

export const dialogTemplate = () =>
	html`<dialog class="ml-dialog">
		<div class="ml-dialog-header">
			<slot name="dialog-header"></slot>
		</div>

		<div class="ml-dialog-body">
			<slot></slot>
		</div>

		<div class="ml-dialog-footer">
			<slot name="dialog-footer"></slot>
		</div>
	</dialog> `;
