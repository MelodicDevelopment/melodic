import { css } from '@melodicdev/core';

export const buttonGroupStyles = () => css`
	:host {
		display: inline-flex;

		/* --- Disabled --- */
		--ml-button-group-disabled-opacity: 0.5;

		/* --- Spacing --- */
		--ml-button-group-item-offset: -1px;
	}

	.ml-button-group {
		display: inline-flex;
		align-items: stretch;
	}

	.ml-button-group--disabled {
		opacity: var(--ml-button-group-disabled-opacity);
		pointer-events: none;
	}

	::slotted(ml-button-group-item) {
		margin-left: var(--ml-button-group-item-offset);
	}

	::slotted(ml-button-group-item:first-child) {
		margin-left: 0;
	}
`;
