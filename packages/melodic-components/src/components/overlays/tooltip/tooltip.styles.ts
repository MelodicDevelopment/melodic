import { css } from '@melodicdev/core';

export const tooltipStyles = () => css`
	:host {
		display: inline-block;
	}

	.ml-tooltip {
		position: relative;
		display: inline-block;
	}

	.ml-tooltip__trigger {
		display: inline-block;
	}

	.ml-tooltip__content {
		position: fixed;
		z-index: 9999;
		max-width: 250px;
		padding: var(--ml-space-2) var(--ml-space-3);
		background-color: var(--ml-gray-900);
		color: var(--ml-white);
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-snug);
		border-radius: var(--ml-radius-md);
		box-shadow: var(--ml-shadow-lg);
		pointer-events: none;
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-duration-150) var(--ml-ease-out),
			transform var(--ml-duration-150) var(--ml-ease-out);
	}

	.ml-tooltip__content--visible {
		opacity: 1;
		transform: scale(1);
	}

	.ml-tooltip__arrow {
		position: absolute;
		width: 8px;
		height: 8px;
		background-color: var(--ml-gray-900);
		transform: rotate(45deg);
	}

	/* Arrow positioning based on placement */
	.ml-tooltip__content[data-placement^='top'] .ml-tooltip__arrow {
		bottom: -4px;
	}

	.ml-tooltip__content[data-placement^='bottom'] .ml-tooltip__arrow {
		top: -4px;
	}

	.ml-tooltip__content[data-placement^='left'] .ml-tooltip__arrow {
		right: -4px;
	}

	.ml-tooltip__content[data-placement^='right'] .ml-tooltip__arrow {
		left: -4px;
	}
`;
