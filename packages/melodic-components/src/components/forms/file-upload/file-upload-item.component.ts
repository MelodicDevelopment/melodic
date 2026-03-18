import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { FileUploadStatus } from './file-upload.types.js';
import { fileUploadItemTemplate } from './file-upload-item.template.js';
import { fileUploadItemStyles } from './file-upload-item.styles.js';

@MelodicComponent({
	selector: 'ml-file-upload-item',
	template: fileUploadItemTemplate,
	styles: fileUploadItemStyles,
	attributes: ['name', 'size', 'status', 'progress', 'error']
})
export class FileUploadItemComponent implements IElementRef {
	elementRef!: HTMLElement;

	name = '';
	size = '';
	status: FileUploadStatus = 'idle';
	progress = 0;
	error = '';
	file: File | null = null;

	get extension(): string {
		const parts = this.name.split('.');
		return parts.length > 1 ? parts.pop()! : '';
	}

	get displayProgress(): string {
		return `${Math.round(Math.min(Math.max(this.progress, 0), 100))}%`;
	}

	get progressWidth(): number {
		return Math.min(Math.max(this.progress, 0), 100);
	}

	handleRemove = (): void => {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:remove', {
				bubbles: true,
				composed: true,
				detail: { name: this.name, file: this.file }
			})
		);
	};

	handleRetry = (): void => {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:retry', {
				bubbles: true,
				composed: true,
				detail: { name: this.name, file: this.file }
			})
		);
	};
}
