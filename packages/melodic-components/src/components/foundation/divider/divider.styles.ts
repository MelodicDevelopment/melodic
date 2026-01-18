import { css } from '@melodicdev/core';

export const dividerStyles = () => css`
	:host {
		display: block;
	}

	:host([orientation='vertical']) {
		display: inline-block;
		height: 100%;
	}

	.ml-divider {
		display: flex;
		align-items: center;
	}

	.ml-divider--horizontal {
		width: 100%;
		height: 1px;
		background-color: var(--ml-color-border);
	}

	.ml-divider--horizontal.ml-divider--with-label {
		height: auto;
		background-color: transparent;
	}

	.ml-divider--horizontal.ml-divider--with-label::before,
	.ml-divider--horizontal.ml-divider--with-label::after {
		content: '';
		flex: 1;
		height: 1px;
		background-color: var(--ml-color-border);
	}

	.ml-divider--horizontal .ml-divider__label {
		padding: 0 var(--ml-space-4);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-muted);
		white-space: nowrap;
	}

	.ml-divider--vertical {
		flex-direction: column;
		width: 1px;
		min-height: 1rem;
		height: 100%;
		background-color: var(--ml-color-border);
	}

	.ml-divider--vertical.ml-divider--with-label {
		width: auto;
		background-color: transparent;
	}

	.ml-divider--vertical.ml-divider--with-label::before,
	.ml-divider--vertical.ml-divider--with-label::after {
		content: '';
		flex: 1;
		width: 1px;
		background-color: var(--ml-color-border);
	}

	.ml-divider--vertical .ml-divider__label {
		padding: var(--ml-space-3) 0;
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-muted);
		writing-mode: vertical-rl;
	}
`;
