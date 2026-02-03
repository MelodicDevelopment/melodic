import type { DialogRef } from './dialog-ref.class';

export interface IDialogRef<T = unknown> {
	onDialogRefSet?: (dialogRef: DialogRef<T>) => void;
}
