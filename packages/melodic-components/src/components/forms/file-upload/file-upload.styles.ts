import { css } from '@melodicdev/core';

export const fileUploadStyles = () => css`
	:host {
		display: block;
		width: 100%;

		/* --- Dropzone --- */
		--ml-file-upload-dropzone-padding: var(--ml-space-6);
		--ml-file-upload-dropzone-border-width: 2px;
		--ml-file-upload-dropzone-border-color: var(--ml-color-border);
		--ml-file-upload-dropzone-border-radius: var(--ml-radius-md);
		--ml-file-upload-dropzone-bg: var(--ml-color-surface);
		--ml-file-upload-dropzone-gap: var(--ml-space-3);
		--ml-file-upload-dropzone-hover-border-color: var(--ml-color-primary);
		--ml-file-upload-dropzone-hover-bg: var(--ml-color-surface-sunken);

		/* --- Focus --- */
		--ml-file-upload-focus-border-color: var(--ml-color-primary);
		--ml-file-upload-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Icon --- */
		--ml-file-upload-icon-size: 40px;
		--ml-file-upload-icon-border-radius: var(--ml-radius-full);
		--ml-file-upload-icon-bg: var(--ml-color-surface-sunken);
		--ml-file-upload-icon-color: var(--ml-color-text-muted);

		/* --- Label --- */
		--ml-file-upload-label-font-size: var(--ml-text-sm);
		--ml-file-upload-label-font-weight: var(--ml-font-semibold);
		--ml-file-upload-label-color: var(--ml-color-primary);
		--ml-file-upload-label-line-height: var(--ml-leading-tight);

		/* --- Sublabel --- */
		--ml-file-upload-sublabel-font-size: var(--ml-text-sm);
		--ml-file-upload-sublabel-color: var(--ml-color-text-muted);
		--ml-file-upload-sublabel-line-height: var(--ml-leading-tight);

		/* --- Hint --- */
		--ml-file-upload-hint-font-size: var(--ml-text-sm);
		--ml-file-upload-hint-color: var(--ml-color-text-muted);

		/* --- Error --- */
		--ml-file-upload-error-font-size: var(--ml-text-sm);
		--ml-file-upload-error-color: var(--ml-color-danger);
		--ml-file-upload-error-border-color: var(--ml-color-danger);

		/* --- Drag over --- */
		--ml-file-upload-drag-icon-color: var(--ml-color-primary);
		--ml-file-upload-drag-icon-bg: var(--ml-color-primary-subtle, rgba(59, 130, 246, 0.1));

		/* --- Disabled --- */
		--ml-file-upload-disabled-bg: var(--ml-color-input-disabled-bg);
		--ml-file-upload-disabled-border-color: var(--ml-color-border);
		--ml-file-upload-disabled-opacity: 0.6;

		/* --- Transition --- */
		--ml-file-upload-transition-duration: var(--ml-duration-150);
		--ml-file-upload-transition-easing: var(--ml-ease-in-out);
	}

	.ml-file-upload {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
	}

	.ml-file-upload__dropzone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--ml-file-upload-dropzone-gap);
		padding: var(--ml-file-upload-dropzone-padding);
		border: var(--ml-file-upload-dropzone-border-width) dashed var(--ml-file-upload-dropzone-border-color);
		border-radius: var(--ml-file-upload-dropzone-border-radius);
		background-color: var(--ml-file-upload-dropzone-bg);
		cursor: pointer;
		transition:
			border-color var(--ml-file-upload-transition-duration) var(--ml-file-upload-transition-easing),
			background-color var(--ml-file-upload-transition-duration) var(--ml-file-upload-transition-easing);
	}

	.ml-file-upload__dropzone:hover {
		border-color: var(--ml-file-upload-dropzone-hover-border-color);
		background-color: var(--ml-file-upload-dropzone-hover-bg);
	}

	.ml-file-upload__dropzone:focus-visible {
		outline: none;
		border-color: var(--ml-file-upload-focus-border-color);
		box-shadow: var(--ml-file-upload-focus-shadow);
	}

	.ml-file-upload__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-file-upload-icon-size);
		height: var(--ml-file-upload-icon-size);
		border-radius: var(--ml-file-upload-icon-border-radius);
		background-color: var(--ml-file-upload-icon-bg);
		color: var(--ml-file-upload-icon-color);
	}

	.ml-file-upload__text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--ml-space-1);
		text-align: center;
	}

	.ml-file-upload__label {
		font-size: var(--ml-file-upload-label-font-size);
		font-weight: var(--ml-file-upload-label-font-weight);
		color: var(--ml-file-upload-label-color);
		line-height: var(--ml-file-upload-label-line-height);
	}

	.ml-file-upload__sublabel {
		font-size: var(--ml-file-upload-sublabel-font-size);
		color: var(--ml-file-upload-sublabel-color);
		line-height: var(--ml-file-upload-sublabel-line-height);
	}

	.ml-file-upload__input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.ml-file-upload__hint {
		font-size: var(--ml-file-upload-hint-font-size);
		color: var(--ml-file-upload-hint-color);
		line-height: var(--ml-file-upload-label-line-height);
	}

	.ml-file-upload__error {
		font-size: var(--ml-file-upload-error-font-size);
		color: var(--ml-file-upload-error-color);
		line-height: var(--ml-file-upload-label-line-height);
	}

	/* Drag over state */
	.ml-file-upload--drag-over .ml-file-upload__dropzone {
		border-color: var(--ml-file-upload-dropzone-hover-border-color);
		background-color: var(--ml-file-upload-dropzone-hover-bg);
	}

	.ml-file-upload--drag-over .ml-file-upload__icon {
		color: var(--ml-file-upload-drag-icon-color);
		background-color: var(--ml-file-upload-drag-icon-bg);
	}

	/* Error state */
	.ml-file-upload--error .ml-file-upload__dropzone {
		border-color: var(--ml-file-upload-error-border-color);
	}

	/* Disabled state */
	.ml-file-upload--disabled .ml-file-upload__dropzone {
		background-color: var(--ml-file-upload-disabled-bg);
		border-color: var(--ml-file-upload-disabled-border-color);
		cursor: not-allowed;
		opacity: var(--ml-file-upload-disabled-opacity);
	}

	.ml-file-upload--disabled .ml-file-upload__dropzone:hover {
		border-color: var(--ml-file-upload-disabled-border-color);
		background-color: var(--ml-file-upload-disabled-bg);
	}
`;
