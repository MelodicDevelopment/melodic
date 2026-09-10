import { css } from '@melodicdev/core';

export const tabPanelStyles = () => css`
	:host {
		/* ── Tab panel: focus ── */
		--ml-tab-panel-focus-width: 2px;
		--ml-tab-panel-focus-color: var(--ml-color-primary);
		--ml-tab-panel-focus-offset: 2px;

		display: block;
	}

	:host([hidden]) {
		display: none;
	}

	.ml-tab-panel {
		outline: none;
	}

	.ml-tab-panel:focus-visible {
		outline: var(--ml-tab-panel-focus-width) solid var(--ml-tab-panel-focus-color);
		outline-offset: var(--ml-tab-panel-focus-offset);
	}
`;
