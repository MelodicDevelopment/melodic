import { MelodicComponent, html } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { AlertVariant } from './alert.types.js';
import { alertTemplate } from './alert.template.js';
import { alertStyles } from './alert.styles.js';

let warnedDeprecatedTitle = false;
function warnDeprecatedTitle(): void {
	if (warnedDeprecatedTitle) return;
	warnedDeprecatedTitle = true;
	console.warn(
		'[ml-alert] The "title" attribute/property is deprecated because it collides with the global HTML title attribute (native tooltip). Use "alert-title" instead. The "title" shim will be removed in the next major release.'
	);
}

/**
 * ml-alert - Alert/notification banner component
 *
 * @example
 * ```html
 * <ml-alert variant="info" alert-title="Information">
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
	attributes: ['variant', 'alert-title', 'title', 'dismissible']
})
export class AlertComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Alert variant/type */
	public variant: AlertVariant = 'info';

	/** Optional title (attribute: alert-title) */
	public alertTitle = '';

	/** Show dismiss button */
	public dismissible = false;

	/** @deprecated Use `alertTitle` (attribute `alert-title`); `title` collides with the global HTML attribute. */
	public get title(): string {
		return this.alertTitle;
	}
	public set title(value: string) {
		warnDeprecatedTitle();
		this.alertTitle = value;
	}

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
