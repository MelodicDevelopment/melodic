import { css } from '@melodicdev/core';

export const checkboxStyles = () => css`
	:host {
		display: block;

		/* --- Box --- */
		--ml-checkbox-box-size: 1.25rem;
		--ml-checkbox-box-bg: var(--ml-color-input-bg);
		--ml-checkbox-box-border-width: var(--ml-border);
		--ml-checkbox-box-border-color: var(--ml-color-border-strong);
		--ml-checkbox-box-border-radius: var(--ml-radius-xs);
		--ml-checkbox-box-color: var(--ml-color-text-inverse);

		/* --- Checked --- */
		--ml-checkbox-checked-bg: var(--ml-color-primary);
		--ml-checkbox-checked-border-color: var(--ml-color-primary);
		--ml-checkbox-checked-hover-bg: var(--ml-color-primary-hover);
		--ml-checkbox-checked-hover-border-color: var(--ml-color-primary-hover);

		/* --- Hover --- */
		--ml-checkbox-hover-border-color: var(--ml-color-primary);

		/* --- Focus --- */
		--ml-checkbox-focus-border-color: var(--ml-color-primary);
		--ml-checkbox-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Label --- */
		--ml-checkbox-label-font-size: var(--ml-text-sm);
		--ml-checkbox-label-font-weight: var(--ml-font-medium);
		--ml-checkbox-label-color: var(--ml-color-text-secondary);
		--ml-checkbox-label-line-height: 1.25rem;

		/* --- Hint --- */
		--ml-checkbox-hint-font-size: var(--ml-text-sm);
		--ml-checkbox-hint-color: var(--ml-color-text-muted);

		/* --- Gap --- */
		--ml-checkbox-gap: var(--ml-space-3);

		/* --- Disabled --- */
		--ml-checkbox-disabled-opacity: 0.5;

		/* --- Transition --- */
		--ml-checkbox-transition-duration: var(--ml-duration-150);
		--ml-checkbox-transition-easing: var(--ml-ease-in-out);
	}

	.ml-checkbox {
		display: inline-flex;
		align-items: flex-start;
		gap: var(--ml-checkbox-gap);
		cursor: pointer;
		user-select: none;
	}

	.ml-checkbox:hover:not(.ml-checkbox--disabled) .ml-checkbox__box {
		border-color: var(--ml-checkbox-hover-border-color);
	}

	.ml-checkbox__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ml-checkbox__input:focus-visible + .ml-checkbox__box {
		border-color: var(--ml-checkbox-focus-border-color);
		box-shadow: var(--ml-checkbox-focus-shadow);
	}

	.ml-checkbox__box {
		position: relative;
		flex-shrink: 0;
		display: block;
		width: var(--ml-checkbox-box-size);
		height: var(--ml-checkbox-box-size);
		background-color: var(--ml-checkbox-box-bg);
		border: var(--ml-checkbox-box-border-width) solid var(--ml-checkbox-box-border-color);
		border-radius: var(--ml-checkbox-box-border-radius);
		color: var(--ml-checkbox-box-color);
		transition:
			background-color var(--ml-checkbox-transition-duration) var(--ml-checkbox-transition-easing),
			border-color var(--ml-checkbox-transition-duration) var(--ml-checkbox-transition-easing),
			box-shadow var(--ml-checkbox-transition-duration) var(--ml-checkbox-transition-easing);
	}

	.ml-checkbox__check,
	.ml-checkbox__minus {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 75%;
		height: 75%;
	}

	.ml-checkbox__label {
		font-size: var(--ml-checkbox-label-font-size);
		font-weight: var(--ml-checkbox-label-font-weight);
		color: var(--ml-checkbox-label-color);
		line-height: var(--ml-checkbox-label-line-height);
	}

	.ml-checkbox__hint {
		display: block;
		margin-top: var(--ml-space-0-5);
		margin-left: calc(var(--ml-checkbox-box-size) + var(--ml-checkbox-gap));
		font-size: var(--ml-checkbox-hint-font-size);
		color: var(--ml-checkbox-hint-color);
		line-height: var(--ml-leading-tight);
	}

	.ml-checkbox--disabled {
		cursor: not-allowed;
		pointer-events: none;
	}

	.ml-checkbox--disabled .ml-checkbox__box,
	.ml-checkbox--disabled .ml-checkbox__label {
		opacity: var(--ml-checkbox-disabled-opacity);
	}

	.ml-checkbox--checked .ml-checkbox__box,
	.ml-checkbox--indeterminate .ml-checkbox__box {
		background-color: var(--ml-checkbox-checked-bg);
		border-color: var(--ml-checkbox-checked-border-color);
	}

	.ml-checkbox--checked:hover:not(.ml-checkbox--disabled) .ml-checkbox__box,
	.ml-checkbox--indeterminate:hover:not(.ml-checkbox--disabled) .ml-checkbox__box {
		background-color: var(--ml-checkbox-checked-hover-bg);
		border-color: var(--ml-checkbox-checked-hover-border-color);
	}

	/* --- Size variants --- */
	.ml-checkbox--sm {
		--ml-checkbox-box-size: 1rem;
	}

	.ml-checkbox--md {
		--ml-checkbox-box-size: 1.25rem;
	}

	.ml-checkbox--lg {
		--ml-checkbox-box-size: 1.5rem;
		--ml-checkbox-label-font-size: var(--ml-text-base);
		--ml-checkbox-label-line-height: 1.5rem;
	}
`;
