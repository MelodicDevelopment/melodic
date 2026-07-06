import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { FileUploadStatus } from './file-upload.types.js';
import { fileUploadItemTemplate } from './file-upload-item.template.js';
import { fileUploadItemStyles } from './file-upload-item.styles.js';

/**
 * ml-file-upload-item - A single file entry in an upload list
 *
 * @fires ml:dismiss - Emitted when the remove button is clicked. Detail: { name, file }
 * @fires ml:remove - Deprecated alias of ml:dismiss (kept for backwards compatibility)
 * @fires ml:retry - Emitted when the retry button is clicked. Detail: { name, file }
 */
@MelodicComponent({
	selector: 'ml-file-upload-item',
	template: fileUploadItemTemplate,
	styles: fileUploadItemStyles,
	attributes: ['name', 'size', 'status', 'progress', 'error']
})
export class FileUploadItemComponent implements IElementRef {
	public elementRef!: HTMLElement;

	public name = '';
	public size = '';
	public status: FileUploadStatus = 'idle';
	public progress = 0;
	public error = '';
	public file: File | null = null;

	public get extension(): string {
		const parts = this.name.split('.');
		return parts.length > 1 ? parts.pop()! : '';
	}

	public get displayProgress(): string {
		return `${Math.round(Math.min(Math.max(this.progress, 0), 100))}%`;
	}

	public get progressWidth(): number {
		return Math.min(Math.max(this.progress, 0), 100);
	}

	public handleRemove = (): void => {
		// Canonical dismissal event (shared vocabulary with ml-alert/ml-toast/ml-tag).
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:dismiss', {
				bubbles: true,
				composed: true,
				detail: { name: this.name, file: this.file }
			})
		);

		// DEPRECATED: ml:remove is kept for backwards compatibility and will be
		// removed in the next major release. Listen for ml:dismiss instead.
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:remove', {
				bubbles: true,
				composed: true,
				detail: { name: this.name, file: this.file }
			})
		);
	};

	public handleRetry = (): void => {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:retry', {
				bubbles: true,
				composed: true,
				detail: { name: this.name, file: this.file }
			})
		);
	};
}
