import { css } from '@melodicdev/core';

export const iconStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Size — default 24px (md)
	 * --ml-icon-size: 24px
	 *
	 * --ml-icon-color: currentColor
	 */

	:host {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		color: var(--ml-icon-color, currentColor);
	}

	:host([size='xs']) {
		--ml-icon-size: 12px;
	}
	:host([size='sm']) {
		--ml-icon-size: 16px;
	}
	:host([size='md']) {
		--ml-icon-size: 24px;
	}
	:host([size='lg']) {
		--ml-icon-size: 32px;
	}
	:host([size='xl']) {
		--ml-icon-size: 48px;
	}

	i {
		font-style: normal;
		font-size: var(--ml-icon-size, 24px);
		line-height: 1;
		speak: never;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	i.ph { font-family: 'Phosphor' !important; }
	i.ph-bold { font-family: 'Phosphor-Bold' !important; }
	i.ph-fill { font-family: 'Phosphor-Fill' !important; }
	i.ph-light { font-family: 'Phosphor-Light' !important; }
	i.ph-thin { font-family: 'Phosphor-Thin' !important; }
`;
