import { MelodicComponent, html } from '@melodicdev/core';
import type { IElementRef, OnCreate } from '@melodicdev/core';
import type { ToastVariant } from './toast-config.interface.js';
import { toastTemplate } from './toast.template.js';
import { toastStyles } from './toast.styles.js';

let warnedDeprecatedTitle = false;
function warnDeprecatedTitle(): void {
	if (warnedDeprecatedTitle) return;
	warnedDeprecatedTitle = true;
	console.warn(
		'[ml-toast] The "title" attribute/property is deprecated because it collides with the global HTML title attribute (native tooltip). Use "toast-title" instead. The "title" shim will be removed in the next major release.'
	);
}

/**
 * ml-toast - Individual toast notification
 *
 * @example
 * ```html
 * <ml-toast variant="success" toast-title="Saved" message="Your changes have been saved."></ml-toast>
 * ```
 *
 * @fires ml:dismiss - Emitted when the toast is dismissed
 */
@MelodicComponent({
	selector: 'ml-toast',
	template: toastTemplate,
	styles: toastStyles,
	attributes: ['variant', 'toast-title', 'title', 'message', 'duration', 'dismissible']
})
export class ToastComponent implements IElementRef, OnCreate {
	public elementRef!: HTMLElement;

	/** Toast variant */
	public variant: ToastVariant = 'info';

	/** Toast title (attribute: toast-title) */
	public toastTitle = '';

	/** Toast message */
	public message = '';

	/** Auto-dismiss duration in ms (0 = no auto-dismiss) */
	public duration = 5000;

	/** Show dismiss button */
	public dismissible = true;

	private _timer: ReturnType<typeof setTimeout> | null = null;

	/** @deprecated Use `toastTitle` (attribute `toast-title`); `title` collides with the global HTML attribute. */
	public get title(): string {
		return this.toastTitle;
	}
	public set title(value: string) {
		warnDeprecatedTitle();
		this.toastTitle = value;
	}

	public onCreate(): void {
		if (this.duration > 0) {
			this._timer = setTimeout(() => this.dismiss(), this.duration);
		}
	}

	public dismiss = (): void => {
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

	public renderIcon = () => {
		const icons: Record<ToastVariant, string> = {
			info: 'info',
			success: 'check-circle',
			warning: 'warning',
			error: 'x-circle'
		};

		return html`<ml-icon icon="${icons[this.variant]}"></ml-icon>`;
	};
}
