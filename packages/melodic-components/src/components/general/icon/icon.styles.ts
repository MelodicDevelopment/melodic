import { css } from '@melodicdev/core';

export const iconStyles = () => css`
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
		font-size: var(--ml-icon-size, 24px);
	}
`;
