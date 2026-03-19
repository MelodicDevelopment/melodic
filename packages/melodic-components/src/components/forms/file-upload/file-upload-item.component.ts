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
