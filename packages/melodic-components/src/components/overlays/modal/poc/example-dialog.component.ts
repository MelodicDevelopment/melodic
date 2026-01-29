import { MelodicComponent, html, css, type IElementRef } from '@melodicdev/core';
import type { DialogRef } from './dialog-ref';

/**
 * Example dialog content component demonstrating the POC pattern.
 *
 * Usage:
 * ```typescript
 * import { dialogService, ExampleDialog } from './poc';
 *
 * const ref = dialogService.open(ExampleDialog, {
 *   size: 'md',
 *   inputs: {
 *     title: 'Confirm Action',
 *     message: 'Are you sure you want to proceed?'
 *   }
 * });
 *
 * const result = await ref.afterClosed();
 * if (result) {
 *   console.log('User confirmed');
 * }
 * ```
 */
@MelodicComponent({
	selector: 'ml-example-dialog',
	template: (c: ExampleDialog) => html`
		<ml-dialog size=${c.size}>
			<div slot="header">
				<ml-icon icon="alert-circle"></ml-icon>
				<span class="dialog-title">${c.title}</span>
			</div>

			<div class="dialog-content">
				<p>${c.message}</p>
			</div>

			<div slot="footer">
				<div class="footer-actions">
					<ml-button
						variant="secondary"
						@click=${() => c.cancel()}
					>
						Cancel
					</ml-button>
					<ml-button
						variant="primary"
						@click=${() => c.confirm()}
					>
						Confirm
					</ml-button>
				</div>
			</div>
		</ml-dialog>
	`,
	styles: () => css`
		:host {
			display: contents;
		}

		.dialog-title {
			font-size: var(--ml-text-lg);
			font-weight: var(--ml-font-semibold);
			color: var(--ml-color-text);
		}

		.dialog-content {
			color: var(--ml-color-text-secondary);
		}

		.dialog-content p {
			margin: 0;
		}

		.footer-actions {
			display: flex;
			align-items: center;
			gap: var(--ml-space-3);
		}
	`,
	attributes: ['title', 'message', 'size']
})
export class ExampleDialog implements IElementRef {
	elementRef!: HTMLElement;

	/** Set by DialogService */
	dialogRef?: DialogRef<boolean>;

	/** Dialog title */
	title = 'Confirm';

	/** Dialog message */
	message = 'Are you sure?';

	/** Dialog size */
	size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';

	confirm(): void {
		this.dialogRef?.close(true);
	}

	cancel(): void {
		this.dialogRef?.close(false);
	}
}
