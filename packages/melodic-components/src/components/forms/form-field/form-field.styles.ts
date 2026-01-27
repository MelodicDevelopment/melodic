import { css } from '@melodicdev/core';

export const formFieldStyles = () => css`
	:host {
		display: block;
		width: 100%;
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
		gap: var(--ml-space-1-5) var(--ml-space-4);
		align-items: start;
	}

	.ml-form-field--horizontal .ml-form-field__label {
		grid-column: 1;
		grid-row: 1;
		padding-top: var(--ml-space-2-5);
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
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-tight);
	}

	.ml-form-field__required {
		color: var(--ml-color-danger);
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
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-tight);
	}

	.ml-form-field__hint {
		color: var(--ml-color-text-muted);
	}

	.ml-form-field__error {
		color: var(--ml-color-danger);
	}

	/* Disabled state */
	.ml-form-field--disabled .ml-form-field__label {
		color: var(--ml-color-text-muted);
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
		padding: var(--ml-space-2-5) var(--ml-space-3-5);
		font-size: var(--ml-text-sm);
		font-family: var(--ml-font-sans);
		color: var(--ml-color-text);
		background-color: var(--ml-color-input-bg);
		border: var(--ml-border) solid var(--ml-color-border-strong);
		border-radius: var(--ml-radius);
		box-shadow: var(--ml-shadow-xs);
		box-sizing: border-box;
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	::slotted(input:focus),
	::slotted(select:focus),
	::slotted(textarea:focus) {
		outline: none;
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	::slotted(input::placeholder),
	::slotted(textarea::placeholder) {
		color: var(--ml-color-text-muted);
	}

	::slotted(input:disabled),
	::slotted(select:disabled),
	::slotted(textarea:disabled) {
		background-color: var(--ml-color-input-disabled-bg);
		cursor: not-allowed;
		color: var(--ml-color-text-muted);
	}

	/* Error state for slotted inputs */
	.ml-form-field--error ::slotted(input),
	.ml-form-field--error ::slotted(select),
	.ml-form-field--error ::slotted(textarea) {
		border-color: var(--ml-color-danger);
	}

	.ml-form-field--error ::slotted(input:focus),
	.ml-form-field--error ::slotted(select:focus),
	.ml-form-field--error ::slotted(textarea:focus) {
		box-shadow: var(--ml-shadow-ring-error);
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
