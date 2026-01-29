import { DialogRef, ML_DIALOG_REF } from './dialog-ref';
import type { MlDialogOverlay } from './overlay.component';

export interface DialogConfig {
	/** Dialog size variant */
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
	/** Input properties to pass to the component */
	inputs?: Record<string, unknown>;
}

/**
 * Constructor type for dialog content components.
 * Components must have a static `selector` property defined by @MelodicComponent.
 */
export type DialogComponentConstructor<TResult = unknown> = (new (...args: unknown[]) => unknown) & {
	selector: string;
};

/**
 * Service for opening dialogs programmatically.
 *
 * Dialog content components should:
 * 1. Use `<ml-dialog>` as their root wrapper
 * 2. Access `dialogRef` property for closing (set by the service)
 *
 * @example
 * ```typescript
 * import { dialogService } from '@melodicdev/components/overlays/modal/poc';
 *
 * // Open a dialog
 * const ref = dialogService.open(MyDialogComponent, {
 *   size: 'md',
 *   inputs: { userId: 123 }
 * });
 *
 * // Wait for result
 * const result = await ref.afterClosed();
 * ```
 *
 * @example
 * ```typescript
 * // Dialog content component
 * @MelodicComponent({
 *   selector: 'my-dialog',
 *   template: (c: MyDialog) => html`
 *     <ml-dialog>
 *       <div slot="header">
 *         <span>My Dialog</span>
 *       </div>
 *
 *       <p>Content here</p>
 *
 *       <div slot="footer">
 *         <ml-button @click=${() => c.dialogRef?.close()}>Cancel</ml-button>
 *         <ml-button variant="primary" @click=${() => c.dialogRef?.close(true)}>Confirm</ml-button>
 *       </div>
 *     </ml-dialog>
 *   `
 * })
 * class MyDialog {
 *   // Set by DialogService when opened
 *   dialogRef?: DialogRef<boolean>;
 * }
 * ```
 */
class DialogService {
	private _openDialogs = new Map<string, { ref: DialogRef; overlay: HTMLElement }>();
	private _idCounter = 0;

	/**
	 * Open a dialog with the specified component
	 */
	open<TResult = unknown>(
		component: DialogComponentConstructor<TResult>,
		config: DialogConfig = {}
	): DialogRef<TResult> {
		const id = `ml-dialog-${++this._idCounter}`;
		const dialogRef = new DialogRef<TResult>(id);

		// Set up close callback
		dialogRef._setCloseCallback((ref) => {
			this._closeDialog(ref.id);
		});

		// Create the overlay and content
		this._mountDialog(id, component, dialogRef, config);

		return dialogRef;
	}

	/**
	 * Close all open dialogs
	 */
	closeAll(): void {
		for (const dialog of this._openDialogs.values()) {
			dialog.ref.close();
		}
	}

	/**
	 * Get number of open dialogs
	 */
	get openCount(): number {
		return this._openDialogs.size;
	}

	/**
	 * Check if any dialogs are open
	 */
	get hasOpenDialogs(): boolean {
		return this._openDialogs.size > 0;
	}

	private _mountDialog<TResult>(
		id: string,
		component: DialogComponentConstructor<TResult>,
		dialogRef: DialogRef<TResult>,
		config: DialogConfig
	): void {
		// Create overlay element
		const overlay = document.createElement('ml-dialog-overlay') as HTMLElement & MlDialogOverlay;
		overlay.id = id;

		// Create content element
		const contentElement = document.createElement(component.selector) as HTMLElement & {
			dialogRef?: DialogRef;
			[key: string]: unknown;
		};

		// Set dialog ref on content element
		contentElement.dialogRef = dialogRef as DialogRef;

		// Also set via symbol for more robust access
		(contentElement as unknown as Record<symbol, unknown>)[ML_DIALOG_REF] = dialogRef;

		// Set any inputs from config
		if (config.inputs) {
			for (const [key, value] of Object.entries(config.inputs)) {
				contentElement[key] = value;
			}
		}

		// Apply size to the ml-dialog inside if present
		if (config.size) {
			contentElement.setAttribute('data-dialog-size', config.size);
		}

		// Append content to overlay
		overlay.appendChild(contentElement);

		// Store references on overlay
		overlay.dialogRef = dialogRef as DialogRef;
		overlay.contentElement = contentElement;

		// Prevent body scroll
		document.body.style.overflow = 'hidden';

		// Append to body
		document.body.appendChild(overlay);

		// Store for tracking
		this._openDialogs.set(id, { ref: dialogRef as DialogRef, overlay });

		// After mount, set up size on inner ml-dialog
		requestAnimationFrame(() => {
			if (config.size) {
				const mlDialog = contentElement.shadowRoot?.querySelector('ml-dialog') ||
					contentElement.querySelector('ml-dialog');
				if (mlDialog) {
					mlDialog.setAttribute('size', config.size);
				}
			}

			// Set up close handler on ml-dialog
			const mlDialog = contentElement.shadowRoot?.querySelector('ml-dialog') ||
				contentElement.querySelector('ml-dialog');
			if (mlDialog && 'setCloseHandler' in mlDialog) {
				(mlDialog as { setCloseHandler: (fn: () => void) => void }).setCloseHandler(() => {
					dialogRef.close();
				});
			}
		});
	}

	private async _closeDialog(id: string): Promise<void> {
		const dialog = this._openDialogs.get(id);
		if (!dialog) return;

		// Remove from tracking
		this._openDialogs.delete(id);

		// Animate out
		const overlayComponent = dialog.overlay as HTMLElement & MlDialogOverlay;
		if (overlayComponent.animateOut) {
			await overlayComponent.animateOut();
		}

		// Remove from DOM
		dialog.overlay.remove();

		// Restore body scroll if no more dialogs
		if (this._openDialogs.size === 0) {
			document.body.style.overflow = '';
		}
	}
}

// Export singleton instance
export const dialogService = new DialogService();
