import { css } from '@melodicdev/core';

export const tooltipStyles = () => css`
	:host {
		/* Tooltip content */
		--ml-tooltip-max-width: 320px;
		--ml-tooltip-padding-y: var(--ml-space-2);
		--ml-tooltip-padding-x: var(--ml-space-3);
		--ml-tooltip-bg: var(--ml-tooltip-bg);
		--ml-tooltip-color: var(--ml-tooltip-text);
		--ml-tooltip-font-size: var(--ml-text-xs);
		--ml-tooltip-font-weight: var(--ml-font-medium);
		--ml-tooltip-line-height: var(--ml-leading-snug);
		--ml-tooltip-radius: var(--ml-radius);
		--ml-tooltip-shadow: var(--ml-shadow-lg);
		--ml-tooltip-transition: var(--ml-duration-150) var(--ml-ease-out);

		/* Arrow */
		--ml-tooltip-arrow-size: 8px;

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
		max-width: var(--ml-tooltip-max-width);
		padding: var(--ml-tooltip-padding-y) var(--ml-tooltip-padding-x);
		background-color: var(--ml-tooltip-bg);
		color: var(--ml-tooltip-color);
		font-size: var(--ml-tooltip-font-size);
		font-weight: var(--ml-tooltip-font-weight);
		line-height: var(--ml-tooltip-line-height);
		border-radius: var(--ml-tooltip-radius);
		box-shadow: var(--ml-tooltip-shadow);
		text-align: center;
		word-wrap: break-word;
		pointer-events: none;
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-tooltip-transition),
			transform var(--ml-tooltip-transition);
	}

	.ml-tooltip__content--visible {
		opacity: 1;
		transform: scale(1);
	}

	.ml-tooltip__arrow {
		position: absolute;
		width: var(--ml-tooltip-arrow-size);
		height: var(--ml-tooltip-arrow-size);
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
