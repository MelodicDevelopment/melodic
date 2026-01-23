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
 * @fires ml-dismiss - Emitted when dismiss button is clicked
 */
@MelodicComponent({
	selector: 'ml-alert',
	template: alertTemplate,
	styles: alertStyles,
	attributes: ['variant', 'title', 'dismissible']
})
export class AlertComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Alert variant/type */
	variant: AlertVariant = 'info';

	/** Optional title */
	title = '';

	/** Show dismiss button */
	dismissible = false;

	handleDismiss = (): void => {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml-dismiss', {
				bubbles: true,
				composed: true
			})
		);
		// Optionally hide the alert
		this.elementRef.setAttribute('hidden', '');
	};

	renderDefaultIcon = () => {
		const icons: Record<AlertVariant, string> = {
			info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
			success:
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
			warning:
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>',
			error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
		};

		return html`<span .innerHTML=${icons[this.variant]}></span>`;
	};
}
