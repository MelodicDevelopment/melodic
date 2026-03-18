import { html, classMap, when } from '@melodicdev/core';
import type { FileUploadComponent } from './file-upload.component.js';

export function fileUploadTemplate(c: FileUploadComponent) {
	return html`
		<div class=${classMap({
			'ml-file-upload': true,
			'ml-file-upload--disabled': c.disabled,
			'ml-file-upload--error': !!c.error,
			'ml-file-upload--drag-over': c.dragOver
		})}>
			<div
				class="ml-file-upload__dropzone"
				role="button"
				tabindex=${c.disabled ? '-1' : '0'}
				aria-label="Upload file"
				aria-disabled=${c.disabled ? 'true' : 'false'}
				@click=${c.handleClick}
				@keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.handleClick(); } }}
				@dragenter=${c.handleDragEnter}
				@dragover=${c.handleDragOver}
				@dragleave=${c.handleDragLeave}
				@drop=${c.handleDrop}
			>
				<div class="ml-file-upload__icon">
					<ml-icon icon=${c.icon} size="lg"></ml-icon>
				</div>
				<div class="ml-file-upload__text">
					<span class="ml-file-upload__label">${c.label}</span>
					${when(!!c.sublabel, () => html`
						<span class="ml-file-upload__sublabel">${c.sublabel}</span>
					`)}
				</div>
			</div>

			<input
				type="file"
				class="ml-file-upload__input"
				accept=${c.accept}
				?multiple=${c.multiple}
				?disabled=${c.disabled}
				@change=${c.handleFileInput}
				tabindex="-1"
				aria-hidden="true"
			/>

			${when(
				!!c.error,
				() => html`<span class="ml-file-upload__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span class="ml-file-upload__hint">${c.hint}</span>`)}`
			)}
		</div>
	`;
}
