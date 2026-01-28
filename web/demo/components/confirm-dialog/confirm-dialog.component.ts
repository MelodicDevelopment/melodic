import { MelodicComponent, html, css, type IElementRef } from '@melodicdev/core';
import type { ModalContent, ModalRef } from '@melodicdev/components';

export interface ConfirmDialogData {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: 'danger' | 'warning' | 'info';
}

const confirmDialogTemplate = (c: ConfirmDialog) => html`
	<div class="confirm-dialog">
		<div class="confirm-dialog__icon confirm-dialog__icon--${c.modalData?.variant ?? 'info'}">
			<ml-icon icon=${c.iconName} size="lg"></ml-icon>
		</div>
		<h3 class="confirm-dialog__title">${c.modalData?.title ?? 'Confirm'}</h3>
		<p class="confirm-dialog__message">${c.modalData?.message ?? 'Are you sure?'}</p>
		<div class="confirm-dialog__actions">
			<ml-button variant="outline" @click=${() => c.cancel()}>
				${c.modalData?.cancelText ?? 'Cancel'}
			</ml-button>
			<ml-button variant=${c.modalData?.variant === 'danger' ? 'danger' : 'primary'} @click=${() => c.confirm()}>
				${c.modalData?.confirmText ?? 'Confirm'}
			</ml-button>
		</div>
	</div>
`;

const confirmDialogStyles = () => css`
	:host {
		font-family: var(--ml-font-sans);
	}

	.confirm-dialog {
		padding: var(--ml-space-6);
		text-align: center;
	}

	.confirm-dialog__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		border-radius: 50%;
		margin-bottom: var(--ml-space-4);
	}

	.confirm-dialog__icon--info {
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	.confirm-dialog__icon--warning {
		background-color: var(--ml-color-warning-subtle);
		color: var(--ml-color-warning);
	}

	.confirm-dialog__icon--danger {
		background-color: var(--ml-color-error-subtle);
		color: var(--ml-color-error);
	}

	.confirm-dialog__title {
		margin: 0 0 var(--ml-space-2);
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
	}

	.confirm-dialog__message {
		margin: 0 0 var(--ml-space-6);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-relaxed);
	}

	.confirm-dialog__actions {
		display: flex;
		justify-content: center;
		gap: var(--ml-space-3);
	}
`;

@MelodicComponent({
	selector: 'confirm-dialog',
	template: confirmDialogTemplate,
	styles: confirmDialogStyles
})
export class ConfirmDialog implements IElementRef, ModalContent<ConfirmDialogData, boolean> {
	static readonly selector = 'confirm-dialog';

	elementRef!: HTMLElement;

	/** Store modal ref and data directly (set by modal service) */
	private _modalRef: ModalRef<ConfirmDialogData, boolean> | null = null;
	private _modalData: ConfirmDialogData | null = null;

	get modalRef(): ModalRef<ConfirmDialogData, boolean> {
		// Try to get from stored value first, then from element
		if (this._modalRef) return this._modalRef;
		// Access the property set by modal service on the element
		const element = this.elementRef as HTMLElement & { _modalRef?: ModalRef<ConfirmDialogData, boolean> };
		return element._modalRef!;
	}

	set modalRef(value: ModalRef<ConfirmDialogData, boolean>) {
		this._modalRef = value;
	}

	get modalData(): ConfirmDialogData {
		if (this._modalData) return this._modalData;
		const element = this.elementRef as HTMLElement & { _modalData?: ConfirmDialogData };
		return element._modalData ?? { title: '', message: '' };
	}

	set modalData(value: ConfirmDialogData) {
		this._modalData = value;
	}

	get iconName(): string {
		switch (this.modalData?.variant) {
			case 'danger':
				return 'warning-circle';
			case 'warning':
				return 'warning';
			default:
				return 'info';
		}
	}

	confirm(): void {
		this.modalRef.close(true);
	}

	cancel(): void {
		this.modalRef.close(false);
	}
}
