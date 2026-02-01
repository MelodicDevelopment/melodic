import { MelodicComponent, html, css, type IElementRef, type OnCreate, type OnDestroy } from '@melodicdev/core';
import type { DialogRef } from './dialog-ref';

/**
 * Overlay component that serves as the backdrop for dialogs.
 * Created by DialogService - should not be used directly.
 * @internal
 */
@MelodicComponent({
	selector: 'ml-dialog-overlay',
	template: (c: MlDialogOverlay) => html`
		<div class="ml-dialog-overlay">
			<slot></slot>
		</div>
	`,
	styles: () => css`
		:host {
			position: fixed;
			inset: 0;
			z-index: 10000;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: var(--ml-color-overlay, rgba(0, 0, 0, 0.5));
			animation: fadeIn var(--ml-transition-normal, 200ms) ease-out;
		}

		:host(.closing) {
			animation: fadeOut var(--ml-transition-normal, 200ms) ease-out;
		}

		.ml-dialog-overlay {
			display: contents;
		}

		@keyframes fadeIn {
			from { opacity: 0; }
			to { opacity: 1; }
		}

		@keyframes fadeOut {
			from { opacity: 1; }
			to { opacity: 0; }
		}
	`
})
export class MlDialogOverlay implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Reference to the dialog (set by service) */
	dialogRef: DialogRef | null = null;

	/** The content component reference (set by service) */
	contentElement: HTMLElement | null = null;

	onCreate(): void {
		// Notify that dialog has opened
		requestAnimationFrame(() => {
			this.dialogRef?._notifyOpened();
		});
	}

	onDestroy(): void {
		// Clean up content element if still attached
		if (this.contentElement?.parentNode) {
			this.contentElement.remove();
		}
	}

	/**
	 * Trigger close animation and remove
	 */
	animateOut(): Promise<void> {
		return new Promise((resolve) => {
			this.elementRef.classList.add('closing');
			this.elementRef.addEventListener('animationend', () => {
				resolve();
			}, { once: true });
		});
	}
}
