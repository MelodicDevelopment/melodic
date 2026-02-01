import { createToken } from '@melodicdev/core/injection';
import type { ModalRef } from './modal-ref';

/**
 * Injection token for accessing the modal reference in content components.
 *
 * @example
 * ```typescript
 * class MyDialog {
 *   constructor(@Inject(MODAL_REF) private modalRef: ModalRef) {}
 *
 *   close() {
 *     this.modalRef.close('result');
 *   }
 * }
 * ```
 */
export const MODAL_REF = createToken<ModalRef>('MODAL_REF');

/**
 * Injection token for accessing data passed when opening the modal.
 *
 * @example
 * ```typescript
 * interface DialogData {
 *   title: string;
 *   message: string;
 * }
 *
 * class MyDialog {
 *   constructor(@Inject(MODAL_DATA) private data: DialogData) {
 *     console.log(data.title, data.message);
 *   }
 * }
 * ```
 */
export const MODAL_DATA = createToken<unknown>('MODAL_DATA');
