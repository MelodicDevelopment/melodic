import { css } from '@melodicdev/core';

export const buttonGroupStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Disabled
	 * --ml-button-group-disabled-opacity: 0.5
	 *
	 * Spacing
	 * --ml-button-group-item-offset: -1px
	 *
	 * Error
	 * --ml-button-group-error-font-size: var(--ml-text-sm)
	 * --ml-button-group-error-color: var(--ml-color-danger)
	 * --ml-button-group-error-margin-top: var(--ml-space-1)
	 * --ml-button-group-error-line-height: var(--ml-leading-tight)
	 */

	:host {
		display: inline-block;
	}

	.ml-button-group {
		display: inline-flex;
		align-items: stretch;
	}

	.ml-button-group--disabled {
		opacity: var(--ml-button-group-disabled-opacity, 0.5);
		pointer-events: none;
	}

	.ml-button-group__error {
		display: block;
		margin-top: var(--ml-button-group-error-margin-top, var(--ml-space-1));
		font-size: var(--ml-button-group-error-font-size, var(--ml-text-sm));
		color: var(--ml-button-group-error-color, var(--ml-color-danger));
		line-height: var(--ml-button-group-error-line-height, var(--ml-leading-tight));
	}

	::slotted(ml-button-group-item) {
		margin-left: var(--ml-button-group-item-offset, -1px);
	}

	::slotted(ml-button-group-item:first-child) {
		margin-left: 0;
	}
`;
