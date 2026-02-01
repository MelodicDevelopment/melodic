import { MelodicComponent, type OnCreate, type OnDestroy, type IElementRef } from '@melodicdev/core';
import { modalTemplate } from './modal.template';
import { modalStyles } from './modal.styles';
import type { ModalSize, ModalHeaderLayout, ModalHeaderAlign } from './modal.types';

@MelodicComponent({
	selector: 'ml-modal',
	template: modalTemplate,
	styles: modalStyles,
	attributes: ['open', 'title', 'description', 'size', 'header-layout', 'header-align', 'show-close', 'close-on-backdrop', 'close-on-escape', 'prevent-close']
})
export class MlModal implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Whether the modal is open */
	open = false;

	/** Modal title */
	title = '';

	/** Modal description/subtitle */
	description = '';

	/** Modal size */
	size: ModalSize = 'md';

	/** Header layout - inline or stacked */
	headerLayout: ModalHeaderLayout = 'inline';

	/** Header alignment */
	headerAlign: ModalHeaderAlign = 'left';

	/** Show close button */
	showClose = true;

	/** Close when clicking backdrop */
	closeOnBackdrop = true;

	/** Close when pressing Escape */
	closeOnEscape = true;

	/** Prevent closing (for loading states) */
	preventClose = false;

	private _previousActiveElement: HTMLElement | null = null;
	private readonly _boundHandleKeydown: (e: KeyboardEvent) => void;

	constructor() {
		this._boundHandleKeydown = this.handleKeydown.bind(this);
	}

	onCreate(): void {
		// Set up keyboard listener
		document.addEventListener('keydown', this._boundHandleKeydown);
	}

	onDestroy(): void {
		document.removeEventListener('keydown', this._boundHandleKeydown);
		this.restoreFocus();
	}

	onPropertyChange(name: string, _: unknown, newValue: unknown): void {
		if (name === 'open') {
			if (newValue) {
				this.onOpen();
			} else {
				this.onClose();
			}
		}
	}

	private onOpen(): void {
		// Store current focus
		this._previousActiveElement = document.activeElement as HTMLElement;

		// Prevent body scroll
		document.body.style.overflow = 'hidden';

		// Focus the modal after render
		requestAnimationFrame(() => {
			const dialog = this.elementRef?.shadowRoot?.querySelector('.ml-modal__dialog');
			if (dialog) {
				(dialog as HTMLElement).focus();
			}
		});

		// Dispatch open event
		this.elementRef?.dispatchEvent(new CustomEvent('ml-open', { bubbles: true, composed: true }));
	}

	private onClose(): void {
		// Restore body scroll
		document.body.style.overflow = '';

		// Restore focus
		this.restoreFocus();

		// Dispatch close event
		this.elementRef?.dispatchEvent(new CustomEvent('ml-close', { bubbles: true, composed: true }));
	}

	private restoreFocus(): void {
		if (this._previousActiveElement && typeof this._previousActiveElement.focus === 'function') {
			this._previousActiveElement.focus();
			this._previousActiveElement = null;
		}
	}

	private handleKeydown(e: KeyboardEvent): void {
		if (!this.open) return;

		if (e.key === 'Escape' && this.closeOnEscape) {
			e.preventDefault();
			this.requestClose('escape');
		}

		// Trap focus within modal
		if (e.key === 'Tab') {
			this.trapFocus(e);
		}
	}

	private trapFocus(e: KeyboardEvent): void {
		const shadowRoot = this.elementRef?.shadowRoot;
		if (!shadowRoot) return;

		const dialog = shadowRoot.querySelector('.ml-modal__dialog');
		if (!dialog) return;

		// Get all focusable elements including slotted content
		const focusableSelectors = [
			'button:not([disabled])',
			'[href]',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])'
		].join(', ');

		const focusableElements = Array.from(dialog.querySelectorAll(focusableSelectors));

		// Also get slotted focusable elements
		const slots = dialog.querySelectorAll('slot');
		slots.forEach((slot) => {
			const assigned = slot.assignedElements({ flatten: true });
			assigned.forEach((el) => {
				if ((el as HTMLElement).matches?.(focusableSelectors)) {
					focusableElements.push(el as HTMLElement);
				}
				const nested = el.querySelectorAll(focusableSelectors);
				focusableElements.push(...(Array.from(nested) as HTMLElement[]));
			});
		});

		if (focusableElements.length === 0) return;

		const firstFocusable = focusableElements[0] as HTMLElement;
		const lastFocusable = focusableElements.at(-1) as HTMLElement | undefined;

		if (!lastFocusable) return;

		// Check if active element is within shadow root or slotted content
		const activeElement = shadowRoot.activeElement || document.activeElement;

		if (e.shiftKey && (activeElement === firstFocusable || activeElement === dialog)) {
			// Shift + Tab from first element wraps to last
			e.preventDefault();
			lastFocusable.focus();
		} else if (!e.shiftKey && activeElement === lastFocusable) {
			// Tab from last element wraps to first
			e.preventDefault();
			firstFocusable.focus();
		}
	}

	requestClose(source: 'backdrop' | 'escape' | 'close-button' = 'close-button'): void {
		if (this.preventClose) return;

		// Dispatch close request event (can be prevented)
		const event = new CustomEvent('ml-close-request', {
			bubbles: true,
			composed: true,
			cancelable: true,
			detail: { source }
		});

		this.elementRef?.dispatchEvent(event);

		if (!event.defaultPrevented) {
			this.open = false;
		}
	}

	handleBackdropClick(e: MouseEvent): void {
		// Only close if clicking directly on backdrop, not on dialog
		if (e.target === e.currentTarget && this.closeOnBackdrop) {
			this.requestClose('backdrop');
		}
	}

	handleCloseClick(): void {
		this.requestClose('close-button');
	}
}
