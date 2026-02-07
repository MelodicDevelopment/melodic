import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { toastContainerTemplate } from './toast-container.template.js';
import { toastContainerStyles } from './toast-container.styles.js';

type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

/**
 * ml-toast-container - Fixed-position container for stacking toasts
 *
 * @example
 * ```html
 * <ml-toast-container position="top-right"></ml-toast-container>
 * ```
 *
 * Call addToast() to programmatically add a toast, or insert
 * ml-toast elements as children.
 */
@MelodicComponent({
	selector: 'ml-toast-container',
	template: toastContainerTemplate,
	styles: toastContainerStyles,
	attributes: ['position']
})
export class ToastContainerComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Fixed position on screen */
	position: ToastPosition = 'top-right';

	/** Programmatically add a toast */
	addToast(options: { variant?: string; title?: string; message?: string; duration?: number }): void {
		const toast = document.createElement('ml-toast');
		if (options.variant) toast.setAttribute('variant', options.variant);
		if (options.title) toast.setAttribute('title', options.title);
		if (options.message) toast.setAttribute('message', options.message);
		if (options.duration !== undefined) toast.setAttribute('duration', String(options.duration));
		this.elementRef.appendChild(toast);
	}
}
