import type { ModalRef } from './modal-ref';

/**
 * Interface for components that can be used as modal content.
 * Implement this interface to get access to the modal ref and data.
 *
 * @example
 * ```typescript
 * @MelodicComponent({
 *   selector: 'confirm-dialog',
 *   template: confirmDialogTemplate,
 *   styles: confirmDialogStyles
 * })
 * class ConfirmDialog implements ModalContent<ConfirmData, boolean> {
 *   modalRef!: ModalRef<ConfirmData, boolean>;
 *   modalData!: ConfirmData;
 *
 *   confirm() {
 *     this.modalRef.close(true);
 *   }
 *
 *   cancel() {
 *     this.modalRef.close(false);
 *   }
 * }
 * ```
 */
export interface ModalContent<TData = unknown, TResult = unknown> {
	/**
	 * Reference to the modal instance.
	 * Use this to close the modal with a result.
	 */
	modalRef: ModalRef<TData, TResult>;

	/**
	 * Data passed when opening the modal.
	 */
	modalData: TData;
}

/**
 * Type helper for modal content component constructors
 */
export type ModalContentConstructor<TData = unknown, TResult = unknown> = new (
	...args: unknown[]
) => ModalContent<TData, TResult>;
