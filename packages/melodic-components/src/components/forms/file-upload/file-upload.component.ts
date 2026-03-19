import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { FileValidationError } from './file-upload.types.js';
import { fileUploadTemplate } from './file-upload.template.js';
import { fileUploadStyles } from './file-upload.styles.js';

@MelodicComponent({
	selector: 'ml-file-upload',
	template: fileUploadTemplate,
	styles: fileUploadStyles,
	attributes: ['accept', 'multiple', 'max-size', 'max-files', 'disabled', 'label', 'sublabel', 'hint', 'error', 'icon']
})
export class FileUploadComponent implements IElementRef {
	elementRef!: HTMLElement;

	accept = '';
	multiple = false;
	maxSize = 0;
	maxFiles = 0;
	disabled = false;
	label = 'Click to upload';
	sublabel = 'or drag and drop';
	hint = '';
	error = '';
	icon = 'cloud-arrow-up';

	dragOver = false;
	_dragCounter = 0;

	handleClick = (): void => {
		if (this.disabled) return;
		const input = this.elementRef.shadowRoot?.querySelector('input[type="file"]') as HTMLInputElement;
		input?.click();
	};

	handleFileInput = (event: Event): void => {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;
		this.processFiles(Array.from(input.files));
		input.value = '';
	};

	handleDragEnter = (event: DragEvent): void => {
		event.preventDefault();
		event.stopPropagation();
		if (this.disabled) return;
		this._dragCounter++;
		if (this._dragCounter === 1) {
			this.dragOver = true;
		}
	};

	handleDragOver = (event: DragEvent): void => {
		event.preventDefault();
		event.stopPropagation();
	};

	handleDragLeave = (event: DragEvent): void => {
		event.preventDefault();
		event.stopPropagation();
		this._dragCounter--;
		if (this._dragCounter === 0) {
			this.dragOver = false;
		}
	};

	handleDrop = (event: DragEvent): void => {
		event.preventDefault();
		event.stopPropagation();
		this._dragCounter = 0;
		this.dragOver = false;
		if (this.disabled) return;
		const files = event.dataTransfer?.files;
		if (!files?.length) return;
		this.processFiles(Array.from(files));
	};

	processFiles(files: File[]): void {
		const errors: FileValidationError[] = [];
		let validFiles = files;

		if (this.accept) {
			const acceptedTypes = this.accept.split(',').map(t => t.trim().toLowerCase());
			validFiles = validFiles.filter(file => {
				const ext = '.' + file.name.split('.').pop()?.toLowerCase();
				const mime = file.type.toLowerCase();
				const matches = acceptedTypes.some(type => {
					if (type.startsWith('.')) return ext === type;
					if (type.endsWith('/*')) return mime.startsWith(type.replace('/*', '/'));
					return mime === type;
				});
				if (!matches) {
					errors.push({ type: 'accept', file, message: `${file.name} is not an accepted file type` });
				}
				return matches;
			});
		}

		if (this.maxSize > 0) {
			validFiles = validFiles.filter(file => {
				if (file.size > this.maxSize) {
					errors.push({ type: 'max-size', file, message: `${file.name} exceeds maximum size` });
					return false;
				}
				return true;
			});
		}

		if (this.maxFiles > 0 && validFiles.length > this.maxFiles) {
			errors.push({ type: 'max-files', message: `Maximum ${this.maxFiles} files allowed` });
			validFiles = validFiles.slice(0, this.maxFiles);
		}

		if (errors.length > 0) {
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:error', {
					bubbles: true,
					composed: true,
					detail: { errors }
				})
			);
		}

		if (validFiles.length > 0) {
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:change', {
					bubbles: true,
					composed: true,
					detail: { files: validFiles }
				})
			);
		}
	}
}
