import { css } from '@melodicdev/core';

export const iconStyles = () => css`
	:host {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		/* Color — defaults to inherited text color */
		--ml-icon-color: currentColor;

		/* Size — default 24px (md) */
		--ml-icon-size: 24px;

		color: var(--ml-icon-color);
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
		font-size: var(--ml-icon-size);
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
