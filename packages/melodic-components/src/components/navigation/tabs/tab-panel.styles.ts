import { css } from '@melodicdev/core';

export const tabPanelStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Tab panel: focus
	 * --ml-tab-panel-focus-width: 2px
	 * --ml-tab-panel-focus-color: var(--ml-color-primary)
	 * --ml-tab-panel-focus-offset: 2px
	 */

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
		outline: var(--ml-tab-panel-focus-width, 2px) solid var(--ml-tab-panel-focus-color, var(--ml-color-primary));
		outline-offset: var(--ml-tab-panel-focus-offset, 2px);
	}
`;
