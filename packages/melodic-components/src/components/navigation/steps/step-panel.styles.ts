import { css } from '@melodicdev/core';

export const stepPanelStyles = () => css`
	:host {
		display: block;
	}

	:host([hidden]) {
		display: none;
	}

	.ml-step-panel {
		outline: none;
	}
`;
