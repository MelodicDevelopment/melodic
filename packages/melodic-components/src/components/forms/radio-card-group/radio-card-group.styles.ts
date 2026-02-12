import { css } from '@melodicdev/core';

export const radioCardGroupStyles = () => css`
	:host {
		display: block;
	}

	.ml-radio-card-group {
		border: none;
		padding: 0;
		margin: 0;
	}

	.ml-radio-card-group__legend {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		margin-bottom: var(--ml-space-3);
		line-height: var(--ml-leading-tight);
	}

	.ml-radio-card-group__required {
		color: var(--ml-color-danger);
		margin-left: var(--ml-space-0-5);
	}

	.ml-radio-card-group__options {
		display: flex;
		gap: var(--ml-space-3);
	}

	.ml-radio-card-group__options--vertical {
		flex-direction: column;
	}

	.ml-radio-card-group__options--horizontal {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.ml-radio-card-group__options--horizontal ::slotted(ml-radio-card) {
		flex: 1 1 0%;
		min-width: 0;
	}

	.ml-radio-card-group--disabled {
		pointer-events: none;
	}

	.ml-radio-card-group--disabled .ml-radio-card-group__legend {
		opacity: 0.5;
	}

	.ml-radio-card-group__hint,
	.ml-radio-card-group__error {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-tight);
	}

	.ml-radio-card-group__hint {
		color: var(--ml-color-text-muted);
	}

	.ml-radio-card-group__error {
		color: var(--ml-color-danger);
	}
`;
