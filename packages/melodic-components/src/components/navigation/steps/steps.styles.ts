import { css } from '@melodicdev/core';

export const stepsStyles = () => css`
	:host {
		/* Compact label */
		--ml-steps-compact-gap: var(--ml-space-3);
		--ml-steps-compact-label-font-family: var(--ml-font-sans);
		--ml-steps-compact-label-font-size: var(--ml-text-sm);
		--ml-steps-compact-label-font-weight: var(--ml-font-medium);
		--ml-steps-compact-label-color: var(--ml-color-text-secondary);
		--ml-steps-compact-label-margin-top: var(--ml-space-3);

		/* Panels */
		--ml-steps-panels-padding-top: var(--ml-space-6);
		--ml-steps-compact-panels-padding-top: var(--ml-space-4);

		/* Focus ring */
		--ml-steps-focus-color: var(--ml-color-primary);
		--ml-steps-focus-radius: var(--ml-radius);

		/* Disabled state */
		--ml-steps-disabled-opacity: 0.5;

		/* Connector */
		--ml-steps-connector-thickness: 2px;
		--ml-steps-connector-color: var(--ml-color-border);
		--ml-steps-connector-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Indicator (numbered & circles) */
		--ml-steps-indicator-size: 32px;
		--ml-steps-indicator-border-width: 2px;
		--ml-steps-indicator-font-size: var(--ml-text-sm);
		--ml-steps-indicator-font-weight: var(--ml-font-medium);
		--ml-steps-indicator-font-family: var(--ml-font-sans);
		--ml-steps-indicator-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Indicator upcoming */
		--ml-steps-upcoming-border-color: var(--ml-color-border);
		--ml-steps-upcoming-color: var(--ml-color-text-secondary);
		--ml-steps-upcoming-bg: var(--ml-color-surface);

		/* Indicator dot (circles variant) */
		--ml-steps-dot-size: 10px;

		/* Icons variant */
		--ml-steps-icon-indicator-size: 40px;
		--ml-steps-icon-indicator-radius: var(--ml-radius-lg);
		--ml-steps-icon-upcoming-color: var(--ml-color-text-muted);
		--ml-steps-icon-current-border-color: var(--ml-color-text);
		--ml-steps-icon-current-color: var(--ml-color-text);

		/* Completed indicator text */
		--ml-steps-completed-indicator-text: #fff;

		/* Bar variant */
		--ml-steps-bar-height: 4px;
		--ml-steps-bar-radius: 2px;
		--ml-steps-bar-color: var(--ml-color-border);

		/* Compact / dots */
		--ml-steps-compact-dot-size: 12px;
		--ml-steps-compact-dot-color: var(--ml-color-border);

		/* Content spacing */
		--ml-steps-content-gap: var(--ml-space-1);
		--ml-steps-track-gap: var(--ml-space-3);
		--ml-steps-vertical-content-padding: var(--ml-space-6);

		/* Label */
		--ml-steps-label-font-family: var(--ml-font-sans);
		--ml-steps-label-font-size: var(--ml-text-sm);
		--ml-steps-label-font-weight: var(--ml-font-medium);
		--ml-steps-label-color: var(--ml-color-text);
		--ml-steps-label-line-height: var(--ml-leading-tight);
		--ml-steps-label-upcoming-color: var(--ml-color-text-secondary);

		/* Description */
		--ml-steps-desc-font-family: var(--ml-font-sans);
		--ml-steps-desc-font-size: var(--ml-text-xs);
		--ml-steps-desc-color: var(--ml-color-text-muted);
		--ml-steps-desc-line-height: var(--ml-leading-normal);

		display: block;
		width: 100%;
	}

	.ml-steps {
		display: flex;
		flex-direction: column;
	}

	/* ============================================
	   STEP LIST
	   ============================================ */
	.ml-steps__list {
		display: flex;
		position: relative;
	}

	.ml-steps--horizontal .ml-steps__list {
		flex-direction: row;
	}

	.ml-steps--vertical .ml-steps__list {
		flex-direction: column;
	}

	/* ============================================
	   COMPACT LABEL (Step X of Y)
	   ============================================ */
	.ml-steps--compact .ml-steps__list {
		gap: var(--ml-steps-compact-gap);
		justify-content: center;
		align-items: center;
	}

	.ml-steps__compact-label {
		font-family: var(--ml-steps-compact-label-font-family);
		font-size: var(--ml-steps-compact-label-font-size);
		font-weight: var(--ml-steps-compact-label-font-weight);
		color: var(--ml-steps-compact-label-color);
		text-align: center;
		margin-top: var(--ml-steps-compact-label-margin-top);
	}

	/* ============================================
	   PANELS
	   ============================================ */
	.ml-steps__panels {
		padding-top: var(--ml-steps-panels-padding-top);
	}

	.ml-steps--compact .ml-steps__panels {
		padding-top: var(--ml-steps-compact-panels-padding-top);
	}

	/* ============================================
	   INLINE STEP STYLES (for config-mode rendering)
	   These mirror step.styles.ts for config-rendered steps
	   ============================================ */

	/* Base step */
	.ml-step {
		display: flex;
		align-items: flex-start;
		cursor: pointer;
		flex: 1;
		min-width: 0;
	}

	.ml-step--disabled {
		cursor: not-allowed;
		opacity: var(--ml-steps-disabled-opacity);
	}

	.ml-step:focus-visible {
		outline: 2px solid var(--ml-steps-focus-color);
		outline-offset: 2px;
		border-radius: var(--ml-steps-focus-radius);
	}

	/* Horizontal layout */
	.ml-step--horizontal {
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.ml-step--horizontal .ml-step__track {
		display: flex;
		align-items: center;
		width: 100%;
		margin-bottom: var(--ml-steps-track-gap);
	}

	.ml-step--horizontal .ml-step__connector-before,
	.ml-step--horizontal .ml-step__connector-after {
		flex: 1;
		height: var(--ml-steps-connector-thickness);
	}

	.ml-step--horizontal .ml-step__connector--hidden {
		visibility: hidden;
	}

	/* Vertical layout */
	.ml-step--vertical {
		flex-direction: row;
		align-items: stretch;
		text-align: left;
	}

	.ml-step--vertical .ml-step__track {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: var(--ml-steps-track-gap);
	}

	.ml-step--vertical .ml-step__connector-before,
	.ml-step--vertical .ml-step__connector-after {
		flex: 1;
		width: var(--ml-steps-connector-thickness);
		min-height: 12px;
	}

	.ml-step--vertical .ml-step__connector--hidden {
		visibility: hidden;
	}

	.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-steps-vertical-content-padding);
	}

	.ml-step--vertical.ml-step--last .ml-step__content {
		padding-bottom: 0;
	}

	/* Connectors */
	.ml-step__connector-before,
	.ml-step__connector-after {
		transition: background-color var(--ml-steps-connector-transition);
	}

	.ml-step__connector--solid {
		background-color: var(--ml-steps-connector-color);
	}

	.ml-step__connector--dotted {
		background-color: transparent !important;
	}

	.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-steps-connector-color) 0,
			var(--ml-steps-connector-color) 4px,
			transparent 4px,
			transparent 8px
		);
		background-size: 100% 2px;
		background-repeat: no-repeat;
		background-position: center;
	}

	.ml-step--vertical .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-steps-connector-color) 0,
			var(--ml-steps-connector-color) 4px,
			transparent 4px,
			transparent 8px
		);
		background-size: 2px 100%;
		background-repeat: no-repeat;
		background-position: center;
	}

	/* Connector coloring - completed */
	.ml-step--completed.ml-step--primary .ml-step__connector--solid {
		background-color: var(--ml-color-primary);
	}
	.ml-step--completed.ml-step--success .ml-step__connector--solid {
		background-color: var(--ml-color-success);
	}
	.ml-step--completed.ml-step--primary.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--completed.ml-step--success.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--completed.ml-step--primary.ml-step--vertical .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--completed.ml-step--success.ml-step--vertical .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}

	/* Connector coloring - current (before colored, after gray) */
	.ml-step--current.ml-step--primary .ml-step__connector-before.ml-step__connector--solid {
		background-color: var(--ml-color-primary);
	}
	.ml-step--current.ml-step--success .ml-step__connector-before.ml-step__connector--solid {
		background-color: var(--ml-color-success);
	}
	.ml-step--current.ml-step--primary.ml-step--horizontal .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--current.ml-step--success.ml-step--horizontal .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--current.ml-step--primary.ml-step--vertical .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-primary) 0,
			var(--ml-color-primary) 4px,
			transparent 4px,
			transparent 8px
		);
	}
	.ml-step--current.ml-step--success.ml-step--vertical .ml-step__connector-before.ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-color-success) 0,
			var(--ml-color-success) 4px,
			transparent 4px,
			transparent 8px
		);
	}

	/* ============================================
	   INDICATOR
	   ============================================ */
	.ml-step__indicator {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ml-step__indicator-inner {
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color var(--ml-steps-indicator-transition),
			border-color var(--ml-steps-indicator-transition),
			color var(--ml-steps-indicator-transition);
	}

	/* Numbered */
	.ml-step__indicator-inner--numbered {
		width: var(--ml-steps-indicator-size);
		height: var(--ml-steps-indicator-size);
		border-radius: 50%;
		font-size: var(--ml-steps-indicator-font-size);
		font-weight: var(--ml-steps-indicator-font-weight);
		font-family: var(--ml-steps-indicator-font-family);
	}

	.ml-step--upcoming .ml-step__indicator-inner--numbered {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-steps-upcoming-border-color);
		color: var(--ml-steps-upcoming-color);
		background-color: var(--ml-steps-upcoming-bg);
	}

	.ml-step--current.ml-step--primary .ml-step__indicator-inner--numbered {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-color-primary);
		background-color: var(--ml-steps-upcoming-bg);
	}

	.ml-step--current.ml-step--success .ml-step__indicator-inner--numbered {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-color-success);
		background-color: var(--ml-steps-upcoming-bg);
	}

	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-primary);
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-steps-completed-indicator-text);
	}

	.ml-step--completed.ml-step--success .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-success);
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-steps-completed-indicator-text);
	}

	/* Circles */
	.ml-step__indicator-inner--circles {
		width: var(--ml-steps-indicator-size);
		height: var(--ml-steps-indicator-size);
		border-radius: 50%;
	}

	.ml-step__indicator-dot {
		width: var(--ml-steps-dot-size);
		height: var(--ml-steps-dot-size);
		border-radius: 50%;
		transition: background-color var(--ml-steps-connector-transition);
	}

	.ml-step--upcoming .ml-step__indicator-inner--circles {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-steps-upcoming-border-color);
		background-color: var(--ml-steps-upcoming-bg);
	}
	.ml-step--upcoming .ml-step__indicator-dot {
		background-color: var(--ml-steps-upcoming-border-color);
	}

	.ml-step--current.ml-step--primary .ml-step__indicator-inner--circles {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-primary);
		background-color: var(--ml-steps-upcoming-bg);
	}
	.ml-step--current.ml-step--primary .ml-step__indicator-dot {
		background-color: var(--ml-color-primary);
	}

	.ml-step--current.ml-step--success .ml-step__indicator-inner--circles {
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-success);
		background-color: var(--ml-steps-upcoming-bg);
	}
	.ml-step--current.ml-step--success .ml-step__indicator-dot {
		background-color: var(--ml-color-success);
	}

	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-primary);
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-steps-completed-indicator-text);
	}

	.ml-step--completed.ml-step--success .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-success);
		border: var(--ml-steps-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-steps-completed-indicator-text);
	}

	/* Icons */
	.ml-step__indicator-inner--icons {
		width: var(--ml-steps-icon-indicator-size);
		height: var(--ml-steps-icon-indicator-size);
		border-radius: var(--ml-steps-icon-indicator-radius);
		border: var(--ml-steps-indicator-border-width) solid var(--ml-steps-upcoming-border-color);
	}

	.ml-step--upcoming .ml-step__indicator-inner--icons {
		border-color: var(--ml-steps-upcoming-border-color);
		background-color: var(--ml-steps-upcoming-bg);
		color: var(--ml-steps-icon-upcoming-color);
	}

	.ml-step--current .ml-step__indicator-inner--icons {
		border-color: var(--ml-steps-icon-current-border-color);
		background-color: var(--ml-steps-upcoming-bg);
		color: var(--ml-steps-icon-current-color);
	}

	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--icons {
		border-color: var(--ml-color-primary);
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	.ml-step--completed.ml-step--success .ml-step__indicator-inner--icons {
		border-color: var(--ml-color-success);
		background-color: var(--ml-color-success-subtle);
		color: var(--ml-color-success);
	}

	/* ============================================
	   BAR VARIANT
	   ============================================ */
	.ml-step--bar {
		flex-direction: column;
		gap: 0;
	}

	.ml-step--bar .ml-step__bar {
		width: 100%;
		height: var(--ml-steps-bar-height);
		border-radius: var(--ml-steps-bar-radius);
		background-color: var(--ml-steps-bar-color);
		margin-bottom: var(--ml-steps-track-gap);
		transition: background-color var(--ml-steps-connector-transition);
	}

	.ml-step--bar.ml-step--current.ml-step--primary .ml-step__bar,
	.ml-step--bar.ml-step--completed.ml-step--primary .ml-step__bar {
		background-color: var(--ml-color-primary);
	}

	.ml-step--bar.ml-step--current.ml-step--success .ml-step__bar,
	.ml-step--bar.ml-step--completed.ml-step--success .ml-step__bar {
		background-color: var(--ml-color-success);
	}

	.ml-step--bar.ml-step--vertical {
		flex-direction: row;
	}

	.ml-step--bar.ml-step--vertical .ml-step__bar {
		width: var(--ml-steps-bar-height);
		height: auto;
		min-height: 40px;
		margin-bottom: 0;
		margin-right: var(--ml-steps-track-gap);
	}

	.ml-step--bar.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-steps-vertical-content-padding);
	}

	.ml-step--bar.ml-step--vertical.ml-step--last .ml-step__content {
		padding-bottom: 0;
	}

	/* ============================================
	   COMPACT / DOTS
	   ============================================ */
	.ml-step--compact {
		flex: 0 0 auto;
		min-width: auto;
		align-items: center;
		justify-content: center;
	}

	.ml-step__dot {
		width: var(--ml-steps-compact-dot-size);
		height: var(--ml-steps-compact-dot-size);
		border-radius: 50%;
		background-color: var(--ml-steps-compact-dot-color);
		transition: background-color var(--ml-steps-connector-transition);
	}

	.ml-step--compact.ml-step--current.ml-step--primary .ml-step__dot,
	.ml-step--compact.ml-step--completed.ml-step--primary .ml-step__dot {
		background-color: var(--ml-color-primary);
	}

	.ml-step--compact.ml-step--current.ml-step--success .ml-step__dot,
	.ml-step--compact.ml-step--completed.ml-step--success .ml-step__dot {
		background-color: var(--ml-color-success);
	}

	/* ============================================
	   CONTENT
	   ============================================ */
	.ml-step__content {
		display: flex;
		flex-direction: column;
		gap: var(--ml-steps-content-gap);
		min-width: 0;
	}

	.ml-step__label {
		font-family: var(--ml-steps-label-font-family);
		font-size: var(--ml-steps-label-font-size);
		font-weight: var(--ml-steps-label-font-weight);
		color: var(--ml-steps-label-color);
		line-height: var(--ml-steps-label-line-height);
		transition: color var(--ml-steps-connector-transition);
	}

	.ml-step--upcoming .ml-step__label {
		color: var(--ml-steps-label-upcoming-color);
	}

	.ml-step--current.ml-step--primary .ml-step__label {
		color: var(--ml-color-primary);
	}

	.ml-step--current.ml-step--success .ml-step__label {
		color: var(--ml-color-success);
	}

	.ml-step__description {
		font-family: var(--ml-steps-desc-font-family);
		font-size: var(--ml-steps-desc-font-size);
		color: var(--ml-steps-desc-color);
		line-height: var(--ml-steps-desc-line-height);
	}

	/* ============================================
	   SLOTTED STEP STYLING
	   ============================================ */
	::slotted(ml-step) {
		flex: 1;
		min-width: 0;
	}
`;
