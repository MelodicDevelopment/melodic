import { html, classMap, styleMap, when } from '@melodicdev/core';
import type { FileUploadItemComponent } from './file-upload-item.component.js';

export function fileUploadItemTemplate(c: FileUploadItemComponent) {
	return html`
		<div class=${classMap({
			'ml-file-item': true,
			[`ml-file-item--${c.status}`]: true
		})}>
			<div class="ml-file-item__icon">
				<ml-file-icon extension=${c.extension} size="md"></ml-file-icon>
			</div>

			<div class="ml-file-item__content">
				<div class="ml-file-item__header">
					<div class="ml-file-item__info">
						<span class="ml-file-item__name">${c.name}</span>
						${when(!!c.size, () => html`
							<span class="ml-file-item__size">${c.size}</span>
						`)}
					</div>
					<button
						class="ml-file-item__remove"
						type="button"
						aria-label="Remove file"
						@click=${c.handleRemove}
					>
						<ml-icon icon="trash" size="sm"></ml-icon>
					</button>
				</div>

				${when(c.status === 'uploading', () => html`
					<div class="ml-file-item__progress">
						<div class="ml-file-item__progress-track">
							<div class="ml-file-item__progress-fill" style=${styleMap({ width: `${c.progressWidth}%` })}></div>
						</div>
						<span class="ml-file-item__progress-text">${c.displayProgress}</span>
					</div>
				`)}

				${when(c.status === 'complete', () => html`
					<div class="ml-file-item__status-row">
						<ml-icon icon="check-circle" size="sm"></ml-icon>
						<span>Complete</span>
					</div>
				`)}

				${when(c.status === 'error', () => html`
					<div class="ml-file-item__status-row ml-file-item__status-row--error">
						<span class="ml-file-item__error-text">${c.error || 'Upload failed'}</span>
						<button class="ml-file-item__retry" type="button" @click=${c.handleRetry}>Try again</button>
					</div>
				`)}
			</div>
		</div>
	`;
}
