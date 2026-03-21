import { css } from '@melodicdev/core';

export const radioStyles = () => css`
	:host {
		display: block;

		/* --- Circle --- */
		--ml-radio-circle-size: 1.25rem;
		--ml-radio-circle-bg: var(--ml-color-input-bg);
		--ml-radio-circle-border-width: var(--ml-border);
		--ml-radio-circle-border-color: var(--ml-color-border-strong);
		--ml-radio-circle-border-radius: var(--ml-radius-full);

		/* --- Dot --- */
		--ml-radio-dot-size: 0.5rem;
		--ml-radio-dot-color: var(--ml-color-primary);

		/* --- Checked --- */
		--ml-radio-checked-border-color: var(--ml-color-primary);
		--ml-radio-checked-bg: var(--ml-color-primary-subtle);
		--ml-radio-checked-hover-border-color: var(--ml-color-primary-hover);
		--ml-radio-checked-hover-dot-color: var(--ml-color-primary-hover);

		/* --- Hover --- */
		--ml-radio-hover-border-color: var(--ml-color-primary);

		/* --- Focus --- */
		--ml-radio-focus-border-color: var(--ml-color-primary);
		--ml-radio-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Label --- */
		--ml-radio-label-font-size: var(--ml-text-sm);
		--ml-radio-label-font-weight: var(--ml-font-medium);
		--ml-radio-label-color: var(--ml-color-text-secondary);
		--ml-radio-label-line-height: 1.25rem;

		/* --- Hint --- */
		--ml-radio-hint-font-size: var(--ml-text-sm);
		--ml-radio-hint-color: var(--ml-color-text-muted);

		/* --- Gap --- */
		--ml-radio-gap: var(--ml-space-3);

		/* --- Disabled --- */
		--ml-radio-disabled-opacity: 0.5;

		/* --- Transition --- */
		--ml-radio-transition-duration: var(--ml-duration-150);
		--ml-radio-transition-easing: var(--ml-ease-in-out);
	}

	.ml-radio {
		display: inline-flex;
		align-items: flex-start;
		gap: var(--ml-radio-gap);
		cursor: pointer;
		user-select: none;
	}

	.ml-radio--disabled {
		cursor: not-allowed;
	}

	.ml-radio--disabled .ml-radio__circle,
	.ml-radio--disabled .ml-radio__label {
		opacity: var(--ml-radio-disabled-opacity);
	}

	.ml-radio__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ml-radio__circle {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-radio-circle-size);
		height: var(--ml-radio-circle-size);
		background-color: var(--ml-radio-circle-bg);
		border: var(--ml-radio-circle-border-width) solid var(--ml-radio-circle-border-color);
		border-radius: var(--ml-radio-circle-border-radius);
		transition:
			background-color var(--ml-radio-transition-duration) var(--ml-radio-transition-easing),
			border-color var(--ml-radio-transition-duration) var(--ml-radio-transition-easing),
			box-shadow var(--ml-radio-transition-duration) var(--ml-radio-transition-easing);
	}

	.ml-radio__input:focus-visible + .ml-radio__circle {
		border-color: var(--ml-radio-focus-border-color);
		box-shadow: var(--ml-radio-focus-shadow);
	}

	.ml-radio--checked .ml-radio__circle {
		border-color: var(--ml-radio-checked-border-color);
		background-color: var(--ml-radio-checked-bg);
	}

	.ml-radio:hover:not(.ml-radio--disabled) .ml-radio__circle {
		border-color: var(--ml-radio-hover-border-color);
	}

	.ml-radio--checked:hover:not(.ml-radio--disabled) .ml-radio__circle {
		border-color: var(--ml-radio-checked-hover-border-color);
	}

	.ml-radio__dot {
		width: var(--ml-radio-dot-size);
		height: var(--ml-radio-dot-size);
		border-radius: var(--ml-radio-circle-border-radius);
		background-color: var(--ml-radio-dot-color);
		transform: scale(0);
		transition: transform var(--ml-radio-transition-duration) var(--ml-radio-transition-easing);
	}

	.ml-radio--checked .ml-radio__dot {
		transform: scale(1);
	}

	.ml-radio--checked:hover:not(.ml-radio--disabled) .ml-radio__dot {
		background-color: var(--ml-radio-checked-hover-dot-color);
	}

	/* --- Size variants --- */
	.ml-radio--sm {
		--ml-radio-circle-size: 1rem;
		--ml-radio-dot-size: 0.375rem;
	}

	.ml-radio--md {
		--ml-radio-circle-size: 1.25rem;
		--ml-radio-dot-size: 0.5rem;
	}

	.ml-radio--lg {
		--ml-radio-circle-size: 1.5rem;
		--ml-radio-dot-size: 0.625rem;
		--ml-radio-label-font-size: var(--ml-text-base);
		--ml-radio-label-line-height: 1.5rem;
	}

	.ml-radio__label {
		font-size: var(--ml-radio-label-font-size);
		font-weight: var(--ml-radio-label-font-weight);
		color: var(--ml-radio-label-color);
		line-height: var(--ml-radio-label-line-height);
	}

	.ml-radio__hint {
		display: block;
		margin-top: var(--ml-space-0-5);
		margin-left: calc(var(--ml-radio-circle-size) + var(--ml-radio-gap));
		font-size: var(--ml-radio-hint-font-size);
		color: var(--ml-radio-hint-color);
		line-height: var(--ml-leading-tight);
	}
`;
