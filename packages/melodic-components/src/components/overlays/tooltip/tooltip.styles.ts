import { css } from '@melodicdev/core';

export const tooltipStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-tooltip-max-width: 320px
	 * --ml-tooltip-padding-y: var(--ml-space-2)
	 * --ml-tooltip-padding-x: var(--ml-space-3)
	 * --ml-tooltip-color: var(--ml-tooltip-text, var(--ml-white))
	 * --ml-tooltip-font-size: var(--ml-text-xs)
	 * --ml-tooltip-font-weight: var(--ml-font-medium)
	 * --ml-tooltip-line-height: var(--ml-leading-snug)
	 * --ml-tooltip-radius: var(--ml-radius)
	 * --ml-tooltip-shadow: var(--ml-shadow-lg)
	 * --ml-tooltip-z-index: 9999
	 * --ml-tooltip-transition-duration: var(--ml-duration-150)
	 * --ml-tooltip-transition-easing: var(--ml-ease-out)
	 *
	 * Arrow
	 * --ml-tooltip-arrow-size: 8px
	 */

	:host {
		/* ── Tooltip: content ──
		   --ml-tooltip-max-width, --ml-tooltip-padding-y, --ml-tooltip-padding-x,
		   --ml-tooltip-color, --ml-tooltip-font-size, --ml-tooltip-font-weight,
		   --ml-tooltip-line-height, --ml-tooltip-radius, --ml-tooltip-shadow,
		   --ml-tooltip-z-index, --ml-tooltip-transition-duration,
		   --ml-tooltip-transition-easing
		   ── Tooltip: arrow ──
		   --ml-tooltip-arrow-size
		   ── Theme-level ──
		   --ml-tooltip-bg / --ml-tooltip-text are defined by the THEME (light and
		   dark presets) and intentionally NOT re-declared here: shadowing
		   --ml-tooltip-bg on :host would override the theme's dark value and
		   consumer overrides, and a same-name alias would be self-referential.
		   Rules reference var(--ml-tooltip-bg, fallback) directly. */

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
		z-index: var(--ml-tooltip-z-index, 9999);
		max-width: var(--ml-tooltip-max-width, 320px);
		padding: var(--ml-tooltip-padding-y, var(--ml-space-2)) var(--ml-tooltip-padding-x, var(--ml-space-3));
		background-color: var(--ml-tooltip-bg, var(--ml-gray-900));
		color: var(--ml-tooltip-color, var(--ml-tooltip-text, var(--ml-white)));
		font-size: var(--ml-tooltip-font-size, var(--ml-text-xs));
		font-weight: var(--ml-tooltip-font-weight, var(--ml-font-medium));
		line-height: var(--ml-tooltip-line-height, var(--ml-leading-snug));
		border-radius: var(--ml-tooltip-radius, var(--ml-radius));
		box-shadow: var(--ml-tooltip-shadow, var(--ml-shadow-lg));
		text-align: center;
		word-wrap: break-word;
		pointer-events: none;
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-tooltip-transition-duration, var(--ml-duration-150)) var(--ml-tooltip-transition-easing, var(--ml-ease-out)),
			transform var(--ml-tooltip-transition-duration, var(--ml-duration-150)) var(--ml-tooltip-transition-easing, var(--ml-ease-out));
	}

	.ml-tooltip__content--visible {
		opacity: 1;
		transform: scale(1);
	}

	.ml-tooltip__arrow {
		position: absolute;
		width: var(--ml-tooltip-arrow-size, 8px);
		height: var(--ml-tooltip-arrow-size, 8px);
		background-color: var(--ml-tooltip-bg, var(--ml-gray-900));
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
