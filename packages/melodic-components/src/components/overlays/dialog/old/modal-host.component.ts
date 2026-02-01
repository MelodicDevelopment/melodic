import { MelodicComponent, type IElementRef, type OnCreate, type OnDestroy, type OnRender } from '@melodicdev/core';

import { modalHostTemplate } from './modal-host.template';
import { modalHostStyles } from './modal-host.styles';
import type { ModalSize, ModalHeaderLayout, ModalHeaderAlign } from './modal.types';
import type { ModalRef } from './modal-ref';

type ComponentConstructor = (new (...args: unknown[]) => unknown) & { selector: string };

interface ModalHostElement extends HTMLElement {
	_modalRef?: ModalRef;
	__contentClass?: ComponentConstructor;
}

/**
 * Modal host component that renders dynamically opened modals.
 * This component is created by the ModalService and should not be used directly.
 * @internal
 */
@MelodicComponent({
	selector: 'ml-modal-host',
	template: modalHostTemplate,
	styles: modalHostStyles,
	attributes: [
		'open',
		'size',
		'header-layout',
		'header-align',
		'show-close',
		'close-on-backdrop',
		'close-on-escape'
	]
})
export class MlModalHost implements IElementRef, OnCreate, OnDestroy, OnRender {
	elementRef!: HTMLElement;

	/** Whether the modal is open */
	open = false;

	/** Modal size */
	size: ModalSize = 'md';

	/** Header layout */
	headerLayout: ModalHeaderLayout = 'inline';

	/** Header alignment */
	headerAlign: ModalHeaderAlign = 'left';

	/** Show close button */
	showClose = true;

	/** Close on backdrop click */
	closeOnBackdrop = true;

	/** Close on escape key */
	closeOnEscape = true;

	/** Reference to the modal */
	private _modalRef: ModalRef | null = null;

	private _previousActiveElement: HTMLElement | null = null;
	private readonly _boundHandleKeydown: (e: KeyboardEvent) => void;
	readonly handleBackdropClick: (e: MouseEvent) => void;
	readonly handleCloseClick: () => void;

	constructor() {
		this._boundHandleKeydown = this._handleKeydown.bind(this);
		this.handleBackdropClick = this._handleBackdropClick.bind(this);
		this.handleCloseClick = this._handleCloseClick.bind(this);
	}

	onCreate(): void {
		document.addEventListener('keydown', this._boundHandleKeydown);

		// Get the modal ref from the host element
		const hostElement = this.elementRef as ModalHostElement;
		this._modalRef = hostElement._modalRef ?? null;
	}

	onRender(): void {
		// Content mounting is handled by the modal service
	}

	onDestroy(): void {
		document.removeEventListener('keydown', this._boundHandleKeydown);
		this._restoreFocus();
	}

	onPropertyChange(name: string, _: unknown, newValue: unknown): void {
		if (name === 'open') {
			// Handle boolean or string "true" value
			const isOpening = newValue === true || newValue === 'true' || newValue === '';
			if (isOpening) {
				this._onOpen();
			} else {
				this._onClose();
			}
		}
	}

	private _onOpen(): void {
		this._previousActiveElement = document.activeElement as HTMLElement;
		document.body.style.overflow = 'hidden';

		requestAnimationFrame(() => {
			const dialog = this.elementRef?.shadowRoot?.querySelector('.ml-modal-host__dialog');
			if (dialog) {
				(dialog as HTMLElement).focus();
			}
		});
	}

	private _onClose(): void {
		document.body.style.overflow = '';
		this._restoreFocus();
	}

	private _restoreFocus(): void {
		if (this._previousActiveElement?.focus) {
			this._previousActiveElement.focus();
			this._previousActiveElement = null;
		}
	}

	private _handleKeydown(e: KeyboardEvent): void {
		if (!this.open) return;

		if (e.key === 'Escape' && this.closeOnEscape) {
			e.preventDefault();
			this._requestClose('escape');
		}

		if (e.key === 'Tab') {
			this._trapFocus(e);
		}
	}

	private _trapFocus(e: KeyboardEvent): void {
		const shadowRoot = this.elementRef?.shadowRoot;
		if (!shadowRoot) return;

		const dialog = shadowRoot.querySelector('.ml-modal-host__dialog');
		if (!dialog) return;

		const focusableSelectors = [
			'button:not([disabled])',
			'[href]',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])'
		].join(', ');

		const focusableElements = Array.from(dialog.querySelectorAll(focusableSelectors));

		// Include slotted elements
		const slots = dialog.querySelectorAll('slot');
		slots.forEach((slot) => {
			const assigned = slot.assignedElements({ flatten: true });
			assigned.forEach((el) => {
				if ((el as HTMLElement).matches?.(focusableSelectors)) {
					focusableElements.push(el);
				}
				focusableElements.push(...Array.from(el.querySelectorAll(focusableSelectors)));
			});
		});

		if (focusableElements.length === 0) return;

		const firstFocusable = focusableElements[0] as HTMLElement;
		const lastFocusable = focusableElements.at(-1) as HTMLElement | undefined;

		if (!lastFocusable) return;

		const activeElement = shadowRoot.activeElement || document.activeElement;

		if (e.shiftKey && (activeElement === firstFocusable || activeElement === dialog)) {
			e.preventDefault();
			lastFocusable.focus();
		} else if (!e.shiftKey && activeElement === lastFocusable) {
			e.preventDefault();
			firstFocusable.focus();
		}
	}

	private _requestClose(_source: 'backdrop' | 'escape' | 'close-button'): void {
		if (this._modalRef?.config.preventClose) return;
		this._modalRef?.close();
	}

	private _handleBackdropClick(e: MouseEvent): void {
		if (e.target === e.currentTarget && this.closeOnBackdrop) {
			this._requestClose('backdrop');
		}
	}

	private _handleCloseClick(): void {
		this._requestClose('close-button');
	}
}
