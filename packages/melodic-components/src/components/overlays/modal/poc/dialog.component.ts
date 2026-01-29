import { MelodicComponent, html, css, type IElementRef, type OnCreate, type OnDestroy } from '@melodicdev/core';

/**
 * Dialog container component.
 * Used as a wrapper inside dialog content components to provide
 * consistent structure with header, content, and footer sections.
 *
 * @example
 * ```typescript
 * // In your dialog content template:
 * const myDialogTemplate = (c: MyDialog) => html`
 *   <ml-dialog>
 *     <div slot="header">
 *       <ml-icon icon="settings"></ml-icon>
 *       <span>Settings</span>
 *     </div>
 *
 *     <p>Dialog body content goes here</p>
 *
 *     <div slot="footer">
 *       <ml-button @click=${() => c.cancel()}>Cancel</ml-button>
 *       <ml-button variant="primary" @click=${() => c.save()}>Save</ml-button>
 *     </div>
 *   </ml-dialog>
 * `;
 * ```
 */
@MelodicComponent({
	selector: 'ml-dialog',
	template: (c: MlDialog) => html`
		<div class="ml-dialog" role="dialog" aria-modal="true" tabindex="-1">
			<div class="ml-dialog__header">
				<div class="ml-dialog__header-content">
					<slot name="header"></slot>
				</div>
				<button
					type="button"
					class="ml-dialog__close"
					@click=${() => c.handleClose()}
					aria-label="Close dialog"
				>
					<ml-icon icon="x" size="sm"></ml-icon>
				</button>
			</div>

			<div class="ml-dialog__body">
				<slot></slot>
			</div>

			<div class="ml-dialog__footer">
				<slot name="footer"></slot>
			</div>
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
			background-color: var(--ml-color-surface);
			border: 1px solid var(--ml-color-border);
			border-radius: var(--ml-radius-xl);
			box-shadow: var(--ml-shadow-xl);
			width: 100%;
			max-width: 500px;
			max-height: calc(100vh - var(--ml-space-8));
			animation: dialogSlideIn var(--ml-transition-normal, 200ms) ease-out;
		}

		:host-context(.closing) {
			animation: dialogSlideOut var(--ml-transition-normal, 200ms) ease-out;
		}

		.ml-dialog {
			display: flex;
			flex-direction: column;
			outline: none;
		}

		/* Header */
		.ml-dialog__header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--ml-space-4);
			padding: var(--ml-space-6);
			border-bottom: 1px solid var(--ml-color-border);
		}

		.ml-dialog__header-content {
			display: flex;
			align-items: center;
			gap: var(--ml-space-3);
			flex: 1;
		}

		.ml-dialog__header-content ::slotted(*) {
			display: flex;
			align-items: center;
			gap: var(--ml-space-3);
		}

		.ml-dialog__close {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			padding: 0;
			border: none;
			border-radius: var(--ml-radius-md);
			background-color: transparent;
			color: var(--ml-color-text-secondary);
			cursor: pointer;
			transition: background-color var(--ml-transition-fast), color var(--ml-transition-fast);
			flex-shrink: 0;
		}

		.ml-dialog__close:hover {
			background-color: var(--ml-color-surface-secondary);
			color: var(--ml-color-text);
		}

		.ml-dialog__close:focus-visible {
			outline: 2px solid var(--ml-color-primary);
			outline-offset: 2px;
		}

		/* Body */
		.ml-dialog__body {
			flex: 1;
			padding: var(--ml-space-6);
			overflow-y: auto;
			max-height: 60vh;
		}

		/* Footer */
		.ml-dialog__footer {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: var(--ml-space-3);
			padding: var(--ml-space-6);
			border-top: 1px solid var(--ml-color-border);
		}

		.ml-dialog__footer ::slotted(*) {
			display: flex;
			align-items: center;
			gap: var(--ml-space-3);
		}

		/* Support for left/right footer sections */
		.ml-dialog__footer ::slotted([slot="footer"]:has([left] + [right])) {
			justify-content: space-between;
			width: 100%;
		}

		/* Hide empty header/footer */
		.ml-dialog__header:not(:has(::slotted(*))) {
			display: none;
		}

		.ml-dialog__footer:not(:has(::slotted(*))) {
			display: none;
		}

		/* Size variants via CSS custom properties */
		:host([size="sm"]) {
			max-width: 400px;
		}

		:host([size="md"]) {
			max-width: 500px;
		}

		:host([size="lg"]) {
			max-width: 640px;
		}

		:host([size="xl"]) {
			max-width: 800px;
		}

		:host([size="full"]) {
			max-width: calc(100vw - var(--ml-space-8));
			max-height: calc(100vh - var(--ml-space-8));
		}

		@keyframes dialogSlideIn {
			from {
				opacity: 0;
				transform: scale(0.95) translateY(10px);
			}
			to {
				opacity: 1;
				transform: scale(1) translateY(0);
			}
		}

		@keyframes dialogSlideOut {
			from {
				opacity: 1;
				transform: scale(1) translateY(0);
			}
			to {
				opacity: 0;
				transform: scale(0.95) translateY(10px);
			}
		}

		/* Responsive */
		@media (max-width: 640px) {
			:host {
				max-width: 100%;
				max-height: 90vh;
				margin: var(--ml-space-2);
			}
		}
	`,
	attributes: ['size']
})
export class MlDialog implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Dialog size variant */
	size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';

	private _closeHandler?: () => void;

	onCreate(): void {
		// Focus the dialog for keyboard navigation
		requestAnimationFrame(() => {
			const dialog = this.elementRef.shadowRoot?.querySelector('.ml-dialog');
			(dialog as HTMLElement)?.focus();
		});

		// Listen for escape key
		document.addEventListener('keydown', this._handleKeydown);
	}

	onDestroy(): void {
		document.removeEventListener('keydown', this._handleKeydown);
	}

	private _handleKeydown = (e: KeyboardEvent): void => {
		if (e.key === 'Escape') {
			e.preventDefault();
			this.handleClose();
		}
	};

	/**
	 * Set a close handler (called by parent components or service)
	 */
	setCloseHandler(handler: () => void): void {
		this._closeHandler = handler;
	}

	/**
	 * Handle close button click
	 */
	handleClose(): void {
		if (this._closeHandler) {
			this._closeHandler();
		} else {
			// Dispatch event for parent to handle
			this.elementRef.dispatchEvent(
				new CustomEvent('ml-dialog-close', {
					bubbles: true,
					composed: true
				})
			);
		}
	}
}
