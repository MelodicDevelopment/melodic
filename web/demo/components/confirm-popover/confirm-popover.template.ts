import { html } from '@melodicdev/core';
import type { ConfirmPopover } from './confirm-popover.component';

export const confirmPopoverTemplate = (c: ConfirmPopover) => html`
	<ml-popover placement="bottom" arrow manual>
		<slot name="trigger" slot="trigger"></slot>

		<div class="confirm-content">
			<div class="confirm-content__header">
				<ml-icon icon="warning-circle" size="md" class="confirm-content__icon"></ml-icon>
				<span class="confirm-content__message">${c.message}</span>
			</div>
			<div class="confirm-content__actions">
				<ml-button size="sm" variant="ghost" @click=${c.cancel}>Cancel</ml-button>
				<ml-button size="sm" variant="danger" @click=${c.confirm}>Confirm</ml-button>
			</div>
		</div>
	</ml-popover>
`;
