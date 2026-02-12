import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { confirmPopoverTemplate } from './confirm-popover.template';
import { confirmPopoverStyles } from './confirm-popover.styles';

@MelodicComponent({
	selector: 'confirm-popover',
	template: confirmPopoverTemplate,
	styles: confirmPopoverStyles,
	attributes: ['message']
})
export class ConfirmPopover implements IElementRef {
	elementRef!: HTMLElement;

	message = 'Are you sure?';

	confirm = (): void => {
		this.dispatch(true);
	};

	cancel = (): void => {
		this.dispatch(false);
	};

	private dispatch(confirmed: boolean): void {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:confirm', {
				detail: { confirmed },
				bubbles: true,
				composed: true
			})
		);
		this.closePopover();
	}

	private closePopover(): void {
		const popoverEl = this.elementRef.shadowRoot?.querySelector('ml-popover');
		const content = popoverEl?.shadowRoot?.querySelector('[popover]') as HTMLElement | null;
		content?.hidePopover();
	}
}
