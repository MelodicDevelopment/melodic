import { ModalRef } from './modal-ref';
import type { ModalConfig } from './modal.types';
import type { ModalContent } from './modal-content';

export interface ModalOpenConfig<TData = unknown> extends ModalConfig {
	/** Data to pass to the modal content component */
	data?: TData;
}

/**
 * Constructor type for modal content components.
 * Components must have a static `selector` property defined by @MelodicComponent.
 */
type ModalContentConstructor<TData = unknown, TResult = unknown> = (new (
	...args: unknown[]
) => ModalContent<TData, TResult>) & { selector: string };

/**
 * Service for opening and managing modals programmatically.
 *
 * @example
 * ```typescript
 * import { modalService } from '@melodicdev/components/modal';
 *
 * // Open a modal with a component
 * const ref = modalService.open(MyDialogComponent, {
 *   data: { title: 'Hello', message: 'World' },
 *   size: 'md'
 * });
 *
 * // Wait for result
 * const result = await ref.afterClosed();
 * ```
 */
class ModalService {
	private _openModals = new Map<string, ModalRef>();
	private _idCounter = 0;
	private _containerElement: HTMLElement | null = null;

	/**
	 * Open a modal with the specified component
	 */
	open<TData = unknown, TResult = unknown>(
		component: ModalContentConstructor<TData, TResult>,
		config: ModalOpenConfig<TData> = {}
	): ModalRef<TData, TResult> {
		const id = `modal-${++this._idCounter}`;
		const modalRef = new ModalRef<TData, TResult>(id, config.data as TData, config);

		// Register close callback to clean up
		modalRef._setCloseCallback((ref) => {
			this._removeModal(ref.id);
		});

		// Store the modal ref
		this._openModals.set(id, modalRef as ModalRef);

		// Create and mount the modal container
		this._mountModal(id, component, modalRef, config);

		return modalRef;
	}

	/**
	 * Close all open modals
	 */
	closeAll(): void {
		for (const modalRef of this._openModals.values()) {
			modalRef.close();
		}
	}

	/**
	 * Get the number of currently open modals
	 */
	get openCount(): number {
		return this._openModals.size;
	}

	/**
	 * Check if any modals are open
	 */
	get hasOpenModals(): boolean {
		return this._openModals.size > 0;
	}

	private _ensureContainer(): HTMLElement {
		if (!this._containerElement) {
			this._containerElement = document.createElement('div');
			this._containerElement.id = 'ml-modal-container';
			this._containerElement.setAttribute('aria-live', 'polite');
			document.body.appendChild(this._containerElement);
		}
		return this._containerElement;
	}

	private _mountModal<TData, TResult>(
		id: string,
		component: ModalContentConstructor<TData, TResult>,
		modalRef: ModalRef<TData, TResult>,
		config: ModalOpenConfig<TData>
	): void {
		const container = this._ensureContainer();

		// Create the modal host element
		const modalHost = document.createElement('ml-modal-host');
		modalHost.id = id;
		modalHost.setAttribute('data-modal-id', id);

		// Set configuration attributes
		if (config.size) modalHost.setAttribute('size', config.size);
		if (config.headerLayout) modalHost.setAttribute('header-layout', config.headerLayout);
		if (config.headerAlign) modalHost.setAttribute('header-align', config.headerAlign);
		if (config.showClose === false) modalHost.setAttribute('show-close', 'false');
		if (config.closeOnBackdrop === false) modalHost.setAttribute('close-on-backdrop', 'false');
		if (config.closeOnEscape === false) modalHost.setAttribute('close-on-escape', 'false');

		// Store references on the host element for the component to access
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const hostWithRefs = modalHost as HTMLElement & { _modalRef: ModalRef; __contentClass: any };
		hostWithRefs._modalRef = modalRef as ModalRef;
		hostWithRefs.__contentClass = component;

		container.appendChild(modalHost);

		// Wait for the component to render, then manually set up the modal
		requestAnimationFrame(() => {
			const shadowRoot = modalHost.shadowRoot;
			if (shadowRoot) {
				// Add the --open class directly
				const backdrop = shadowRoot.querySelector('.ml-modal-host__backdrop');
				if (backdrop) {
					backdrop.classList.add('ml-modal-host__backdrop--open');
				}

				// Mount the content component
				const contentContainer = shadowRoot.querySelector('.ml-modal-host__content');
				if (contentContainer && component.selector) {
					const contentElement = document.createElement(component.selector) as HTMLElement & {
						_modalRef?: ModalRef;
						_modalData?: unknown;
					};
					// Use underscore-prefixed names to avoid collision with component property mapping
					contentElement._modalRef = modalRef as ModalRef;
					contentElement._modalData = modalRef.data;
					contentContainer.appendChild(contentElement);
				}
			}

			// Prevent body scroll
			document.body.style.overflow = 'hidden';
		});
	}

	private _removeModal(id: string): void {
		this._openModals.delete(id);

		// Remove the modal host element
		const modalHost = document.getElementById(id);
		if (modalHost) {
			// Trigger close animation by removing the --open class
			const shadowRoot = modalHost.shadowRoot;
			if (shadowRoot) {
				const backdrop = shadowRoot.querySelector('.ml-modal-host__backdrop');
				if (backdrop) {
					backdrop.classList.remove('ml-modal-host__backdrop--open');
				}
			}

			// Restore body scroll
			document.body.style.overflow = '';

			// Remove after animation
			setTimeout(() => {
				modalHost.remove();

				// Clean up container if no more modals
				if (this._openModals.size === 0 && this._containerElement) {
					this._containerElement.remove();
					this._containerElement = null;
				}
			}, 200); // Match animation duration
		}
	}
}

// Export singleton instance
export const modalService = new ModalService();
