import { css } from '@melodicdev/core';

export const radioCardGroupStyles = () => css`
	:host {
		display: block;

		/* --- Legend --- */
		--ml-radio-card-group-legend-font-size: var(--ml-text-sm);
		--ml-radio-card-group-legend-font-weight: var(--ml-font-medium);
		--ml-radio-card-group-legend-color: var(--ml-color-text-secondary);
		--ml-radio-card-group-legend-line-height: var(--ml-leading-tight);
		--ml-radio-card-group-legend-margin-bottom: var(--ml-space-3);

		/* --- Required indicator --- */
		--ml-radio-card-group-required-color: var(--ml-color-danger);

		/* --- Options gap --- */
		--ml-radio-card-group-gap: var(--ml-space-3);

		/* --- Disabled --- */
		--ml-radio-card-group-disabled-opacity: 0.5;

		/* --- Hint / Error --- */
		--ml-radio-card-group-hint-color: var(--ml-color-text-muted);
		--ml-radio-card-group-error-color: var(--ml-color-danger);
		--ml-radio-card-group-message-font-size: var(--ml-text-sm);
		--ml-radio-card-group-message-line-height: var(--ml-leading-tight);
	}

	.ml-radio-card-group {
		border: none;
		padding: 0;
		margin: 0;
	}

	.ml-radio-card-group__legend {
		font-size: var(--ml-radio-card-group-legend-font-size);
		font-weight: var(--ml-radio-card-group-legend-font-weight);
		color: var(--ml-radio-card-group-legend-color);
		margin-bottom: var(--ml-radio-card-group-legend-margin-bottom);
		line-height: var(--ml-radio-card-group-legend-line-height);
	}

	.ml-radio-card-group__required {
		color: var(--ml-radio-card-group-required-color);
		margin-left: var(--ml-space-0-5);
	}

	.ml-radio-card-group__options {
		display: flex;
		gap: var(--ml-radio-card-group-gap);
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
		opacity: var(--ml-radio-card-group-disabled-opacity);
	}

	.ml-radio-card-group__hint,
	.ml-radio-card-group__error {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-radio-card-group-message-font-size);
		line-height: var(--ml-radio-card-group-message-line-height);
	}

	.ml-radio-card-group__hint {
		color: var(--ml-radio-card-group-hint-color);
	}

	.ml-radio-card-group__error {
		color: var(--ml-radio-card-group-error-color);
	}
`;
