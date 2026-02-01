import { MelodicComponent, html, css, when, type IElementRef, type OnCreate } from '@melodicdev/core';
import type { DialogRef } from './dialog-ref';

export interface UserData {
	id?: number;
	name: string;
	email: string;
}

/**
 * Advanced example dialog showing the full pattern with:
 * - Loading state
 * - Edit mode with delete button
 * - Left/right footer sections
 * - Form handling
 *
 * This mirrors the Angular unavailable-availability-dialog pattern.
 */
@MelodicComponent({
	selector: 'ml-advanced-example-dialog',
	template: (c: AdvancedExampleDialog) => html`
		<ml-dialog size="md">
			<div slot="header">
				<ml-icon icon=${c.userData?.id ? 'edit' : 'user-plus'}></ml-icon>
				<span class="dialog-title">
					${c.userData?.id ? 'Edit User' : 'Add User'}
				</span>
			</div>

			${when(
				c.loading,
				() => html`
					<div class="loading-container">
						<ml-spinner></ml-spinner>
						<span>Loading...</span>
					</div>
				`,
				() => html`
					<div class="form-content">
						<div class="form-field">
							<label for="name">Name</label>
							<ml-input
								id="name"
								.value=${c.name}
								@input=${(e: Event) => c.name = (e.target as HTMLInputElement).value}
								placeholder="Enter name"
							></ml-input>
						</div>

						<div class="form-field">
							<label for="email">Email</label>
							<ml-input
								id="email"
								type="email"
								.value=${c.email}
								@input=${(e: Event) => c.email = (e.target as HTMLInputElement).value}
								placeholder="Enter email"
							></ml-input>
						</div>
					</div>
				`
			)}

			<div slot="footer">
				<div class="footer-container">
					<div class="footer-left">
						${when(
							c.userData?.id !== undefined,
							() => html`
								<ml-button
									variant="danger"
									@click=${() => c.delete()}
									?disabled=${c.saving}
								>
									Delete
								</ml-button>
							`
						)}
					</div>

					<div class="footer-right">
						<ml-button
							variant="secondary"
							@click=${() => c.cancel()}
							?disabled=${c.saving}
						>
							Cancel
						</ml-button>
						<ml-button
							variant="primary"
							@click=${() => c.save()}
							?disabled=${c.saving || !c.isValid}
						>
							${when(
								c.saving,
								() => html`<ml-spinner size="sm"></ml-spinner>`,
								() => html`Save`
							)}
						</ml-button>
					</div>
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

		.loading-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: var(--ml-space-4);
			padding: var(--ml-space-8);
			color: var(--ml-color-text-secondary);
		}

		.form-content {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-4);
		}

		.form-field {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-2);
		}

		.form-field label {
			font-size: var(--ml-text-sm);
			font-weight: var(--ml-font-medium);
			color: var(--ml-color-text);
		}

		.footer-container {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
		}

		.footer-left,
		.footer-right {
			display: flex;
			align-items: center;
			gap: var(--ml-space-3);
		}
	`
})
export class AdvancedExampleDialog implements IElementRef, OnCreate {
	elementRef!: HTMLElement;

	/** Set by DialogService */
	dialogRef?: DialogRef<{ action: 'save' | 'delete'; data?: UserData } | undefined>;

	/** Initial user data (for edit mode) */
	userData?: UserData;

	/** Form state */
	name = '';
	email = '';

	/** Loading states */
	loading = false;
	saving = false;

	get isValid(): boolean {
		return this.name.trim().length > 0 && this.email.includes('@');
	}

	onCreate(): void {
		// If editing, populate form fields
		if (this.userData) {
			this.name = this.userData.name;
			this.email = this.userData.email;
		}
	}

	cancel(): void {
		this.dialogRef?.close(undefined);
	}

	async save(): Promise<void> {
		if (!this.isValid || this.saving) return;

		this.saving = true;

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		this.dialogRef?.close({
			action: 'save',
			data: {
				id: this.userData?.id,
				name: this.name,
				email: this.email
			}
		});
	}

	async delete(): Promise<void> {
		if (this.saving) return;

		this.saving = true;

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));

		this.dialogRef?.close({
			action: 'delete',
			data: this.userData
		});
	}
}
