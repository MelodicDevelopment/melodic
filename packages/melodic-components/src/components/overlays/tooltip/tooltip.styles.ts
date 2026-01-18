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
		max-width: 320px;
		padding: var(--ml-space-2) var(--ml-space-3);
		background-color: var(--ml-tooltip-bg);
		color: var(--ml-tooltip-text);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		line-height: var(--ml-leading-snug);
		border-radius: var(--ml-radius);
		box-shadow: var(--ml-shadow-lg);
		text-align: center;
		word-wrap: break-word;
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
		background-color: var(--ml-tooltip-bg);
		transform: rotate(45deg);
	}

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
