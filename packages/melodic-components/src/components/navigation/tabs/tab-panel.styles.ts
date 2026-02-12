import { css } from '@melodicdev/core';

export const tabPanelStyles = () => css`
	:host {
		display: block;
	}

	:host([hidden]) {
		display: none;
	}

	.ml-tab-panel {
		outline: none;
	}

	.ml-tab-panel:focus-visible {
		outline: 2px solid var(--ml-color-primary);
		outline-offset: 2px;
	}
`;
