import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { ToastPosition } from './toast-config.interface.js';
import { toastContainerTemplate } from './toast-container.template.js';
import { toastContainerStyles } from './toast-container.styles.js';

/**
 * ml-toast-container - Fixed-position container for stacking toasts
 *
 * Managed automatically by ToastService. You should not need to
 * place this component manually.
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
}
