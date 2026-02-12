import { css } from '@melodicdev/core';

export const buttonGroupStyles = () => css`
	:host {
		display: inline-flex;
	}

	.ml-button-group {
		display: inline-flex;
		align-items: stretch;
	}

	.ml-button-group--disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	::slotted(ml-button-group-item) {
		margin-left: -1px;
	}

	::slotted(ml-button-group-item:first-child) {
		margin-left: 0;
	}
`;
