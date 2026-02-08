import { MelodicComponent, html } from '@melodicdev/core';
import type { IElementRef, OnCreate } from '@melodicdev/core';
import type { ToastVariant } from './toast-config.interface.js';
import { toastTemplate } from './toast.template.js';
import { toastStyles } from './toast.styles.js';

/**
 * ml-toast - Individual toast notification
 *
 * @example
 * ```html
 * <ml-toast variant="success" title="Saved" message="Your changes have been saved."></ml-toast>
 * ```
 *
 * @fires ml:dismiss - Emitted when the toast is dismissed
 */
@MelodicComponent({
	selector: 'ml-toast',
	template: toastTemplate,
	styles: toastStyles,
	attributes: ['variant', 'title', 'message', 'duration', 'dismissible']
})
export class ToastComponent implements IElementRef, OnCreate {
	elementRef!: HTMLElement;

	/** Toast variant */
	variant: ToastVariant = 'info';

	/** Toast title */
	title = '';

	/** Toast message */
	message = '';

	/** Auto-dismiss duration in ms (0 = no auto-dismiss) */
	duration = 5000;

	/** Show dismiss button */
	dismissible = true;

	private _timer: ReturnType<typeof setTimeout> | null = null;

	onCreate(): void {
		if (this.duration > 0) {
			this._timer = setTimeout(() => this.dismiss(), this.duration);
		}
	}

	dismiss = (): void => {
		if (this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:dismiss', {
				bubbles: true,
				composed: true
			})
		);

		this.elementRef.remove();
	};

	renderIcon = () => {
		const icons: Record<ToastVariant, string> = {
			info: 'info',
			success: 'check-circle',
			warning: 'warning',
			error: 'x-circle'
		};

		return html`<ml-icon icon="${icons[this.variant]}"></ml-icon>`;
	};
}
