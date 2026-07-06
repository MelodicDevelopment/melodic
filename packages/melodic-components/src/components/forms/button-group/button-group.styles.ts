import { css } from '@melodicdev/core';

export const buttonGroupStyles = () => css`
	:host {
		display: inline-block;

		/* --- Disabled --- */
		--ml-button-group-disabled-opacity: 0.5;

		/* --- Spacing --- */
		--ml-button-group-item-offset: -1px;

		/* --- Error --- */
		--ml-button-group-error-font-size: var(--ml-text-sm);
		--ml-button-group-error-color: var(--ml-color-danger);
		--ml-button-group-error-margin-top: var(--ml-space-1);
		--ml-button-group-error-line-height: var(--ml-leading-tight);
	}

	.ml-button-group {
		display: inline-flex;
		align-items: stretch;
	}

	.ml-button-group--disabled {
		opacity: var(--ml-button-group-disabled-opacity);
		pointer-events: none;
	}

	.ml-button-group__error {
		display: block;
		margin-top: var(--ml-button-group-error-margin-top);
		font-size: var(--ml-button-group-error-font-size);
		color: var(--ml-button-group-error-color);
		line-height: var(--ml-button-group-error-line-height);
	}

	::slotted(ml-button-group-item) {
		margin-left: var(--ml-button-group-item-offset);
	}

	::slotted(ml-button-group-item:first-child) {
		margin-left: 0;
	}
`;
