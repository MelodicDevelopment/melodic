import { css } from '@melodicdev/core';

export const tagStyles = () => css`
	:host {
		display: inline-block;

		/* ── Tag: base ── */
		--ml-tag-font: var(--ml-font-sans);
		--ml-tag-font-weight: var(--ml-font-medium);
		--ml-tag-radius: var(--ml-radius-md);
		--ml-tag-border-width: var(--ml-border);
		--ml-tag-border-color: var(--ml-color-border);
		--ml-tag-bg: var(--ml-color-surface);
		--ml-tag-color: var(--ml-color-text);

		/* ── Tag: dot colors ── */
		--ml-tag-dot-success: var(--ml-color-success);
		--ml-tag-dot-warning: var(--ml-color-warning);
		--ml-tag-dot-danger: var(--ml-color-danger);
		--ml-tag-dot-info: var(--ml-color-info);
		--ml-tag-dot-primary: var(--ml-color-primary);
		--ml-tag-dot-secondary: var(--ml-color-secondary);

		/* ── Tag: count ── */
		--ml-tag-count-color: var(--ml-color-text-secondary);

		/* ── Tag: close button ── */
		--ml-tag-close-color: var(--ml-color-text-muted);
		--ml-tag-close-hover-color: var(--ml-color-text-secondary);
		--ml-tag-close-active-color: var(--ml-color-text);

		/* ── Tag: checkbox ── */
		--ml-tag-checkbox-border: var(--ml-color-border-strong);
		--ml-tag-checkbox-bg: var(--ml-color-surface);
		--ml-tag-checkbox-checked-bg: var(--ml-color-primary);
		--ml-tag-checkbox-checked-border: var(--ml-color-primary);
		--ml-tag-checkbox-hover-border: var(--ml-color-primary);
		--ml-tag-checkbox-checked-hover-bg: var(--ml-color-primary-hover);
		--ml-tag-checkbox-checked-hover-border: var(--ml-color-primary-hover);

		/* ── Tag: disabled ── */
		--ml-tag-disabled-opacity: 0.5;
	}

	.ml-tag {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		font-family: var(--ml-tag-font);
		font-weight: var(--ml-tag-font-weight);
		line-height: 1;
		white-space: nowrap;
		border-radius: var(--ml-tag-radius);
		border: var(--ml-tag-border-width) solid var(--ml-tag-border-color);
		background-color: var(--ml-tag-bg);
		color: var(--ml-tag-color);
	}

	/* Sizes */
	.ml-tag--sm {
		padding: var(--ml-space-0-5) var(--ml-space-2);
		font-size: var(--ml-text-xs);
	}

	.ml-tag--md {
		padding: var(--ml-space-1) var(--ml-space-2-5);
		font-size: var(--ml-text-sm);
	}

	.ml-tag--lg {
		padding: var(--ml-space-1-5) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	/* Dot indicator */
	.ml-tag__dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--ml-radius-full);
		flex-shrink: 0;
	}

	.ml-tag--sm .ml-tag__dot {
		width: 0.375rem;
		height: 0.375rem;
	}

	.ml-tag__dot--success {
		background-color: var(--ml-tag-dot-success);
	}

	.ml-tag__dot--warning {
		background-color: var(--ml-tag-dot-warning);
	}

	.ml-tag__dot--danger {
		background-color: var(--ml-tag-dot-danger);
	}

	.ml-tag__dot--info {
		background-color: var(--ml-tag-dot-info);
	}

	.ml-tag__dot--primary {
		background-color: var(--ml-tag-dot-primary);
	}

	.ml-tag__dot--secondary {
		background-color: var(--ml-tag-dot-secondary);
	}

	/* Avatar */
	.ml-tag__avatar {
		width: 1rem;
		height: 1rem;
		border-radius: var(--ml-radius-full);
		object-fit: cover;
		flex-shrink: 0;
		margin-left: calc(var(--ml-space-0-5) * -1);
	}

	.ml-tag--sm .ml-tag__avatar {
		width: 0.875rem;
		height: 0.875rem;
	}

	.ml-tag--lg .ml-tag__avatar {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* Icon */
	.ml-tag__icon {
		flex-shrink: 0;
		margin-left: calc(var(--ml-space-0-5) * -1);
	}

	/* Content */
	.ml-tag__content {
		display: inline-flex;
		align-items: center;
	}

	/* Count */
	.ml-tag__count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: inherit;
		font-weight: var(--ml-tag-font-weight);
		color: var(--ml-tag-count-color);
	}

	/* Close button */
	.ml-tag__close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		margin: 0;
		margin-right: calc(var(--ml-space-1) * -1);
		border: none;
		background: none;
		color: var(--ml-tag-close-color);
		cursor: pointer;
		border-radius: var(--ml-radius-sm);
		transition: color 0.15s ease;
		line-height: 0;
	}

	.ml-tag__close:hover {
		color: var(--ml-tag-close-hover-color);
	}

	.ml-tag__close:active {
		color: var(--ml-tag-close-active-color);
	}

	/* Checkbox */
	.ml-tag__checkbox {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		padding: 0;
		margin: 0;
		margin-left: calc(var(--ml-space-0-5) * -1);
		border: var(--ml-tag-border-width) solid var(--ml-tag-checkbox-border);
		border-radius: var(--ml-radius-sm);
		background: var(--ml-tag-checkbox-bg);
		cursor: pointer;
		flex-shrink: 0;
		transition: background-color 0.15s ease, border-color 0.15s ease;
		color: white;
	}

	.ml-tag--sm .ml-tag__checkbox {
		width: 0.875rem;
		height: 0.875rem;
	}

	.ml-tag--lg .ml-tag__checkbox {
		width: 1.125rem;
		height: 1.125rem;
	}

	.ml-tag__checkbox svg {
		width: 0.75rem;
		height: 0.75rem;
	}

	.ml-tag__checkbox--checked {
		background-color: var(--ml-tag-checkbox-checked-bg);
		border-color: var(--ml-tag-checkbox-checked-border);
	}

	.ml-tag__checkbox:hover {
		border-color: var(--ml-tag-checkbox-hover-border);
	}

	.ml-tag__checkbox--checked:hover {
		background-color: var(--ml-tag-checkbox-checked-hover-bg);
		border-color: var(--ml-tag-checkbox-checked-hover-border);
	}

	/* Disabled state */
	.ml-tag--disabled {
		opacity: var(--ml-tag-disabled-opacity);
		pointer-events: none;
	}
`;
