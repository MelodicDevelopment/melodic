import { css } from '@melodicdev/core';

export const fileUploadStyles = () => css`
	:host {
		display: block;
		width: 100%;
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
		gap: var(--ml-space-3);
		padding: var(--ml-space-6) var(--ml-space-6);
		border: 2px dashed var(--ml-color-border);
		border-radius: var(--ml-radius-md);
		background-color: var(--ml-color-surface);
		cursor: pointer;
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-file-upload__dropzone:hover {
		border-color: var(--ml-color-primary);
		background-color: var(--ml-color-surface-sunken);
	}

	.ml-file-upload__dropzone:focus-visible {
		outline: none;
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-file-upload__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--ml-radius-full);
		background-color: var(--ml-color-surface-sunken);
		color: var(--ml-color-text-muted);
	}

	.ml-file-upload__text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--ml-space-1);
		text-align: center;
	}

	.ml-file-upload__label {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-primary);
		line-height: var(--ml-leading-tight);
	}

	.ml-file-upload__sublabel {
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
		line-height: var(--ml-leading-tight);
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
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
		line-height: var(--ml-leading-tight);
	}

	.ml-file-upload__error {
		font-size: var(--ml-text-sm);
		color: var(--ml-color-danger);
		line-height: var(--ml-leading-tight);
	}

	/* Drag over state */
	.ml-file-upload--drag-over .ml-file-upload__dropzone {
		border-color: var(--ml-color-primary);
		background-color: var(--ml-color-surface-sunken);
	}

	.ml-file-upload--drag-over .ml-file-upload__icon {
		color: var(--ml-color-primary);
		background-color: var(--ml-color-primary-subtle, rgba(59, 130, 246, 0.1));
	}

	/* Error state */
	.ml-file-upload--error .ml-file-upload__dropzone {
		border-color: var(--ml-color-danger);
	}

	/* Disabled state */
	.ml-file-upload--disabled .ml-file-upload__dropzone {
		background-color: var(--ml-color-input-disabled-bg);
		border-color: var(--ml-color-border);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ml-file-upload--disabled .ml-file-upload__dropzone:hover {
		border-color: var(--ml-color-border);
		background-color: var(--ml-color-input-disabled-bg);
	}
`;
