import { css } from '@melodicdev/core';

export const badgeGroupStyles = () => css`
	:host {
		display: inline-block;
	}

	.ml-badge-group {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-2);
		font-family: var(--ml-font-sans);
		font-weight: var(--ml-font-medium);
		line-height: 1;
		white-space: nowrap;
		border: var(--ml-border) solid transparent;
	}

	/* Themes */
	.ml-badge-group--pill {
		border-radius: var(--ml-radius-full);
	}

	.ml-badge-group--modern {
		border-radius: var(--ml-radius-md);
	}

	/* Sizes */
	.ml-badge-group--sm {
		padding: 3px 8px 3px 3px;
		font-size: var(--ml-text-xs);
	}

	.ml-badge-group--md {
		padding: 4px 10px 4px 4px;
		font-size: var(--ml-text-xs);
	}

	.ml-badge-group--lg {
		padding: 4px 12px 4px 4px;
		font-size: var(--ml-text-sm);
	}

	/* Outer container colors */
	.ml-badge-group--default {
		background-color: var(--ml-badge-default-bg);
		border-color: var(--ml-badge-default-border);
		color: var(--ml-badge-default-text);
	}

	.ml-badge-group--primary {
		background-color: var(--ml-badge-primary-bg);
		border-color: var(--ml-badge-primary-border);
		color: var(--ml-badge-primary-text);
	}

	.ml-badge-group--success {
		background-color: var(--ml-badge-success-bg);
		border-color: var(--ml-badge-success-border);
		color: var(--ml-badge-success-text);
	}

	.ml-badge-group--warning {
		background-color: var(--ml-badge-warning-bg);
		border-color: var(--ml-badge-warning-border);
		color: var(--ml-badge-warning-text);
	}

	.ml-badge-group--error {
		background-color: var(--ml-badge-error-bg);
		border-color: var(--ml-badge-error-border);
		color: var(--ml-badge-error-text);
	}

	/* Inner label badge */
	.ml-badge-group__label {
		display: inline-flex;
		align-items: center;
		padding: 2px var(--ml-space-2);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		line-height: 1;
		white-space: nowrap;
		border-radius: var(--ml-radius-full);
	}

	.ml-badge-group--modern .ml-badge-group__label {
		border-radius: var(--ml-radius-sm);
	}

	/* Inner label colors - slightly stronger than the outer bg */
	.ml-badge-group__label--default {
		background-color: var(--ml-color-surface);
		color: var(--ml-badge-default-text);
		border: 1px solid var(--ml-badge-default-border);
	}

	.ml-badge-group__label--primary {
		background-color: var(--ml-color-surface);
		color: var(--ml-badge-primary-text);
		border: 1px solid var(--ml-badge-primary-border);
	}

	.ml-badge-group__label--success {
		background-color: var(--ml-color-surface);
		color: var(--ml-badge-success-text);
		border: 1px solid var(--ml-badge-success-border);
	}

	.ml-badge-group__label--warning {
		background-color: var(--ml-color-surface);
		color: var(--ml-badge-warning-text);
		border: 1px solid var(--ml-badge-warning-border);
	}

	.ml-badge-group__label--error {
		background-color: var(--ml-color-surface);
		color: var(--ml-badge-error-text);
		border: 1px solid var(--ml-badge-error-border);
	}

	/* Text */
	.ml-badge-group__text {
		display: inline-flex;
		align-items: center;
	}

	/* Icon */
	.ml-badge-group__icon {
		display: inline-flex;
		flex-shrink: 0;
	}
`;
