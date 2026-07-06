import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { registerAdapter } from '@melodicdev/core/forms';
import type { FileValidationError } from './file-upload.types.js';
import { fileUploadTemplate } from './file-upload.template.js';
import { fileUploadStyles } from './file-upload.styles.js';

// Forms adapter: lets `:formControl` bind to ml-file-upload. The control value
// is the selected File[] in `multiple` mode, or a single File | null otherwise.
// Validator messages auto-populate the existing `error` attribute via the
// directive's standard error sync.
registerAdapter<File[] | File | null>((el) => el.tagName === 'ML-FILE-UPLOAD', {
	inputEvent: 'ml:change',
	blurEvent: 'focusout',
	getValue: (el) => {
		const e = el as unknown as { files: File[]; multiple: boolean };
		return e.multiple ? e.files : (e.files[0] ?? null);
	},
	setValue: (el, value) => {
		const e = el as unknown as { files: File[] };
		if (value === null || value === undefined) {
			if (e.files.length > 0) e.files = [];
		} else if (Array.isArray(value)) {
			e.files = value;
		} else {
			e.files = [value];
		}
	},
	setDisabled: (el, disabled) => {
		(el as unknown as { disabled: boolean }).disabled = disabled;
	}
});

/**
 * ml-file-upload - Drag-and-drop / click-to-browse file selection dropzone
 *
 * @fires ml:change - Emitted when valid files are selected. Detail: { files }
 * @fires ml:error - Emitted when files fail validation. Detail: { errors }
 */
@MelodicComponent({
	selector: 'ml-file-upload',
	template: fileUploadTemplate,
	styles: fileUploadStyles,
	attributes: ['accept', 'multiple', 'max-size', 'max-files', 'disabled', 'label', 'sublabel', 'hint', 'error', 'icon']
})
export class FileUploadComponent implements IElementRef {
	public elementRef!: HTMLElement;

	public accept = '';
	public multiple = false;
	public maxSize = 0;
	public maxFiles = 0;
	public disabled = false;
	public label = 'Click to upload';
	public sublabel = 'or drag and drop';
	public hint = '';
	public error = '';
	public icon = 'cloud-arrow-up';

	public dragOver = false;
	private _dragCounter = 0;

	/**
	 * The currently selected (valid) files. Accumulates across selections in
	 * `multiple` mode and is replaced by the latest selection otherwise. This
	 * backs the forms adapter, so a bound FormControl stays in sync; it can
	 * also be set programmatically (e.g. control.setValue([]) to reset).
	 */
	public files: File[] = [];

	/** Remove a previously selected file (keeps a bound FormControl in sync). */
	public removeFile = (file: File): void => {
		if (!this.files.includes(file)) return;
		this.files = this.files.filter((f) => f !== file);
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { files: this.files }
			})
		);
	};

	public handleClick = (): void => {
		if (this.disabled) return;
		const input = this.elementRef.shadowRoot?.querySelector('input[type="file"]') as HTMLInputElement;
		input?.click();
	};

	public handleFileInput = (event: Event): void => {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;
		this.processFiles(Array.from(input.files));
		input.value = '';
	};

	public handleDragEnter = (event: DragEvent): void => {
		event.preventDefault();
		event.stopPropagation();
		if (this.disabled) return;
		this._dragCounter++;
		if (this._dragCounter === 1) {
			this.dragOver = true;
		}
	};

	public handleDragOver = (event: DragEvent): void => {
		event.preventDefault();
		event.stopPropagation();
	};

	public handleDragLeave = (event: DragEvent): void => {
		event.preventDefault();
		event.stopPropagation();
		this._dragCounter--;
		if (this._dragCounter === 0) {
			this.dragOver = false;
		}
	};

	public handleDrop = (event: DragEvent): void => {
		event.preventDefault();
		event.stopPropagation();
		this._dragCounter = 0;
		this.dragOver = false;
		if (this.disabled) return;
		const files = event.dataTransfer?.files;
		if (!files?.length) return;
		this.processFiles(Array.from(files));
	};

	public processFiles(files: File[]): void {
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
			// Track selection state (backs the forms adapter): accumulate in
			// multiple mode, replace in single mode.
			this.files = this.multiple ? [...this.files, ...validFiles] : validFiles.slice(0, 1);

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
