import { MelodicComponent, html } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { AlertVariant } from './alert.types.js';
import { alertTemplate } from './alert.template.js';
import { alertStyles } from './alert.styles.js';

/**
 * ml-alert - Alert/notification banner component
 *
 * @example
 * ```html
 * <ml-alert variant="info" title="Information">
 *   This is an informational message.
 * </ml-alert>
 *
 * <ml-alert variant="success" dismissible>
 *   Your changes have been saved.
 * </ml-alert>
 * ```
 *
 * @slot default - Alert message content
 * @slot icon - Custom icon (optional)
 * @fires ml:dismiss - Emitted when dismiss button is clicked
 */
@MelodicComponent({
	selector: 'ml-alert',
	template: alertTemplate,
	styles: alertStyles,
	attributes: ['variant', 'title', 'dismissible']
})
export class AlertComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Alert variant/type */
	public variant: AlertVariant = 'info';

	/** Optional title */
	public title = '';

	/** Show dismiss button */
	public dismissible = false;

	public handleDismiss = (): void => {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:dismiss', {
				bubbles: true,
				composed: true
			})
		);
		// Optionally hide the alert
		this.elementRef.setAttribute('hidden', '');
	};

	public renderDefaultIcon = () => {
		const icons: Record<AlertVariant, string> = {
			info: 'info',
			success: 'check-circle',
			warning: 'warning',
			error: 'x-circle'
		};

		return html`<ml-icon icon="${icons[this.variant]}"></ml-icon>`;
	};
}
