import { css } from '@melodicdev/core';

export const fileUploadItemStyles = () => css`
	:host {
		display: block;
		width: 100%;
	}

	.ml-file-item {
		display: flex;
		gap: var(--ml-space-3);
		padding: var(--ml-space-4);
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-md);
		background-color: var(--ml-color-surface);
		transition: border-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-file-item__icon {
		flex-shrink: 0;
		display: flex;
		align-items: flex-start;
		padding-top: var(--ml-space-0-5);
	}

	.ml-file-item__content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-2);
	}

	.ml-file-item__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-2);
	}

	.ml-file-item__info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
	}

	.ml-file-item__name {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-file-item__size {
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
		line-height: var(--ml-leading-tight);
	}

	.ml-file-item__remove {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		border-radius: var(--ml-radius);
		background: transparent;
		color: var(--ml-color-text-muted);
		cursor: pointer;
		transition:
			color var(--ml-duration-150) var(--ml-ease-in-out),
			background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-file-item__remove:hover {
		color: var(--ml-color-danger);
		background-color: var(--ml-color-surface-sunken);
	}

	.ml-file-item__remove:focus-visible {
		outline: none;
		box-shadow: var(--ml-shadow-focus-ring);
	}

	/* Progress */
	.ml-file-item__progress {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
	}

	.ml-file-item__progress-track {
		flex: 1;
		height: 6px;
		background-color: var(--ml-color-surface-sunken);
		border-radius: var(--ml-radius-full);
		overflow: hidden;
	}

	.ml-file-item__progress-fill {
		height: 100%;
		background-color: var(--ml-color-primary);
		border-radius: var(--ml-radius-full);
		transition: width var(--ml-duration-300) var(--ml-ease-out);
	}

	.ml-file-item__progress-text {
		flex-shrink: 0;
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		min-width: 32px;
		text-align: right;
	}

	/* Status row */
	.ml-file-item__status-row {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-success);
		line-height: var(--ml-leading-tight);
	}

	.ml-file-item__status-row--error {
		color: var(--ml-color-danger);
	}

	.ml-file-item__error-text {
		font-size: var(--ml-text-sm);
		color: var(--ml-color-danger);
	}

	.ml-file-item__retry {
		padding: 0;
		border: none;
		background: transparent;
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-primary);
		cursor: pointer;
		text-decoration: underline;
		font-family: var(--ml-font-sans);
	}

	.ml-file-item__retry:hover {
		color: var(--ml-color-primary-hover);
	}

	.ml-file-item__retry:focus-visible {
		outline: none;
		box-shadow: var(--ml-shadow-focus-ring);
		border-radius: var(--ml-radius-xs);
	}

	/* Error state */
	.ml-file-item--error {
		border-color: var(--ml-color-danger);
	}

	/* Complete state */
	.ml-file-item--complete {
		border-color: var(--ml-color-success);
	}
`;
