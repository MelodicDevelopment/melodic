import { css } from '@melodicdev/core';

export const formFieldStyles = () => css`
	:host {
		display: block;
		width: 100%;

		/* --- Label --- */
		--ml-form-field-label-font-size: var(--ml-text-sm);
		--ml-form-field-label-font-weight: var(--ml-font-medium);
		--ml-form-field-label-color: var(--ml-color-text-secondary);
		--ml-form-field-label-line-height: var(--ml-leading-tight);

		/* --- Required indicator --- */
		--ml-form-field-required-color: var(--ml-color-danger);

		/* --- Hint / Error --- */
		--ml-form-field-hint-font-size: var(--ml-text-sm);
		--ml-form-field-hint-color: var(--ml-color-text-muted);
		--ml-form-field-error-color: var(--ml-color-danger);

		/* --- Disabled --- */
		--ml-form-field-disabled-label-color: var(--ml-color-text-muted);

		/* --- Slotted input --- */
		--ml-form-field-input-padding: var(--ml-space-2-5) var(--ml-space-3-5);
		--ml-form-field-input-font-size: var(--ml-text-sm);
		--ml-form-field-input-font-family: var(--ml-font-sans);
		--ml-form-field-input-color: var(--ml-color-text);
		--ml-form-field-input-bg: var(--ml-color-input-bg);
		--ml-form-field-input-border-width: var(--ml-border);
		--ml-form-field-input-border-color: var(--ml-color-border-strong);
		--ml-form-field-input-border-radius: var(--ml-radius);
		--ml-form-field-input-shadow: var(--ml-shadow-xs);
		--ml-form-field-input-focus-border-color: var(--ml-color-primary);
		--ml-form-field-input-focus-shadow: var(--ml-shadow-focus-ring);
		--ml-form-field-input-placeholder-color: var(--ml-color-text-muted);
		--ml-form-field-input-disabled-bg: var(--ml-color-input-disabled-bg);
		--ml-form-field-input-disabled-color: var(--ml-color-text-muted);
		--ml-form-field-input-error-border-color: var(--ml-color-danger);
		--ml-form-field-input-error-focus-shadow: var(--ml-shadow-ring-error);

		/* --- Horizontal layout --- */
		--ml-form-field-horizontal-gap: var(--ml-space-4);
		--ml-form-field-horizontal-label-padding-top: var(--ml-space-2-5);

		/* --- Transition --- */
		--ml-form-field-transition-duration: var(--ml-duration-150);
		--ml-form-field-transition-easing: var(--ml-ease-in-out);
	}

	.ml-form-field {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
	}

	/* Horizontal orientation */
	.ml-form-field--horizontal {
		display: grid;
		grid-template-columns: minmax(100px, auto) 1fr;
		grid-template-rows: auto auto;
		gap: var(--ml-space-1-5) var(--ml-form-field-horizontal-gap);
		align-items: start;
	}

	.ml-form-field--horizontal .ml-form-field__label {
		grid-column: 1;
		grid-row: 1;
		padding-top: var(--ml-form-field-horizontal-label-padding-top);
		text-align: right;
	}

	.ml-form-field--horizontal .ml-form-field__control {
		grid-column: 2;
		grid-row: 1;
	}

	.ml-form-field--horizontal .ml-form-field__hint,
	.ml-form-field--horizontal .ml-form-field__error {
		grid-column: 2;
		grid-row: 2;
	}

	/* Label */
	.ml-form-field__label {
		font-size: var(--ml-form-field-label-font-size);
		font-weight: var(--ml-form-field-label-font-weight);
		color: var(--ml-form-field-label-color);
		line-height: var(--ml-form-field-label-line-height);
	}

	.ml-form-field__required {
		color: var(--ml-form-field-required-color);
		margin-left: var(--ml-space-0-5);
	}

	/* Control wrapper */
	.ml-form-field__control {
		display: flex;
		flex-direction: column;
	}

	/* Hint and error messages */
	.ml-form-field__hint,
	.ml-form-field__error {
		font-size: var(--ml-form-field-hint-font-size);
		line-height: var(--ml-form-field-label-line-height);
	}

	.ml-form-field__hint {
		color: var(--ml-form-field-hint-color);
	}

	.ml-form-field__error {
		color: var(--ml-form-field-error-color);
	}

	/* Disabled state */
	.ml-form-field--disabled .ml-form-field__label {
		color: var(--ml-form-field-disabled-label-color);
	}

	/* Size variants - Labels */
	.ml-form-field--sm .ml-form-field__label {
		font-size: var(--ml-text-xs);
	}

	.ml-form-field--sm .ml-form-field__hint,
	.ml-form-field--sm .ml-form-field__error {
		font-size: var(--ml-text-xs);
	}

	.ml-form-field--lg .ml-form-field__label {
		font-size: var(--ml-text-base);
	}

	.ml-form-field--lg .ml-form-field__hint,
	.ml-form-field--lg .ml-form-field__error {
		font-size: var(--ml-text-base);
	}

	/* Slotted native input styling */
	::slotted(input),
	::slotted(select),
	::slotted(textarea) {
		width: 100%;
		padding: var(--ml-form-field-input-padding);
		font-size: var(--ml-form-field-input-font-size);
		font-family: var(--ml-form-field-input-font-family);
		color: var(--ml-form-field-input-color);
		background-color: var(--ml-form-field-input-bg);
		border: var(--ml-form-field-input-border-width) solid var(--ml-form-field-input-border-color);
		border-radius: var(--ml-form-field-input-border-radius);
		box-shadow: var(--ml-form-field-input-shadow);
		box-sizing: border-box;
		transition:
			border-color var(--ml-form-field-transition-duration) var(--ml-form-field-transition-easing),
			box-shadow var(--ml-form-field-transition-duration) var(--ml-form-field-transition-easing);
	}

	::slotted(input:focus),
	::slotted(select:focus),
	::slotted(textarea:focus) {
		outline: none;
		border-color: var(--ml-form-field-input-focus-border-color);
		box-shadow: var(--ml-form-field-input-focus-shadow);
	}

	::slotted(input::placeholder),
	::slotted(textarea::placeholder) {
		color: var(--ml-form-field-input-placeholder-color);
	}

	::slotted(input:disabled),
	::slotted(select:disabled),
	::slotted(textarea:disabled) {
		background-color: var(--ml-form-field-input-disabled-bg);
		cursor: not-allowed;
		color: var(--ml-form-field-input-disabled-color);
	}

	/* Error state for slotted inputs */
	.ml-form-field--error ::slotted(input),
	.ml-form-field--error ::slotted(select),
	.ml-form-field--error ::slotted(textarea) {
		border-color: var(--ml-form-field-input-error-border-color);
	}

	.ml-form-field--error ::slotted(input:focus),
	.ml-form-field--error ::slotted(select:focus),
	.ml-form-field--error ::slotted(textarea:focus) {
		box-shadow: var(--ml-form-field-input-error-focus-shadow);
	}

	/* Size variants for slotted inputs */
	.ml-form-field--sm ::slotted(input),
	.ml-form-field--sm ::slotted(select),
	.ml-form-field--sm ::slotted(textarea) {
		padding: var(--ml-space-1-5) var(--ml-space-2-5);
		font-size: var(--ml-text-xs);
	}

	.ml-form-field--lg ::slotted(input),
	.ml-form-field--lg ::slotted(select),
	.ml-form-field--lg ::slotted(textarea) {
		padding: var(--ml-space-3-5) var(--ml-space-4);
		font-size: var(--ml-text-base);
	}

	/* Horizontal size adjustments */
	.ml-form-field--horizontal.ml-form-field--sm .ml-form-field__label {
		padding-top: var(--ml-space-2);
	}

	.ml-form-field--horizontal.ml-form-field--lg .ml-form-field__label {
		padding-top: var(--ml-space-3-5);
	}
`;
