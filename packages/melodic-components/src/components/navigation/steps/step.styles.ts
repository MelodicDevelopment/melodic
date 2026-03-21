import { css } from '@melodicdev/core';

export const stepStyles = () => css`
	:host {
		/* Focus ring */
		--ml-step-focus-color: var(--ml-color-primary);
		--ml-step-focus-radius: var(--ml-radius);

		/* Disabled state */
		--ml-step-disabled-opacity: 0.5;

		/* Connector */
		--ml-step-connector-thickness: 2px;
		--ml-step-connector-color: var(--ml-color-border);
		--ml-step-connector-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Indicator (numbered & circles) */
		--ml-step-indicator-size: 32px;
		--ml-step-indicator-border-width: 2px;
		--ml-step-indicator-font-size: var(--ml-text-sm);
		--ml-step-indicator-font-weight: var(--ml-font-medium);
		--ml-step-indicator-font-family: var(--ml-font-sans);
		--ml-step-indicator-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Indicator upcoming */
		--ml-step-upcoming-border-color: var(--ml-color-border);
		--ml-step-upcoming-color: var(--ml-color-text-secondary);
		--ml-step-upcoming-bg: var(--ml-color-surface);

		/* Indicator dot (circles variant) */
		--ml-step-dot-size: 10px;

		/* Icons variant */
		--ml-step-icon-indicator-size: 40px;
		--ml-step-icon-indicator-radius: var(--ml-radius-lg);
		--ml-step-icon-upcoming-color: var(--ml-color-text-muted);
		--ml-step-icon-current-border-color: var(--ml-color-text);
		--ml-step-icon-current-color: var(--ml-color-text);

		/* Completed indicator text */
		--ml-step-completed-indicator-text: #fff;

		/* Bar variant */
		--ml-step-bar-height: 4px;
		--ml-step-bar-radius: 2px;
		--ml-step-bar-color: var(--ml-color-border);

		/* Compact / dots */
		--ml-step-compact-dot-size: 12px;
		--ml-step-compact-dot-color: var(--ml-color-border);

		/* Content spacing */
		--ml-step-content-gap: var(--ml-space-1);
		--ml-step-track-gap: var(--ml-space-3);
		--ml-step-vertical-content-padding: var(--ml-space-6);

		/* Label */
		--ml-step-label-font-family: var(--ml-font-sans);
		--ml-step-label-font-size: var(--ml-text-sm);
		--ml-step-label-font-weight: var(--ml-font-medium);
		--ml-step-label-color: var(--ml-color-text);
		--ml-step-label-line-height: var(--ml-leading-tight);
		--ml-step-label-upcoming-color: var(--ml-color-text-secondary);

		/* Description */
		--ml-step-desc-font-family: var(--ml-font-sans);
		--ml-step-desc-font-size: var(--ml-text-xs);
		--ml-step-desc-color: var(--ml-color-text-muted);
		--ml-step-desc-line-height: var(--ml-leading-normal);

		display: contents;
	}

	/* ============================================
	   BASE STEP
	   ============================================ */
	.ml-step {
		display: flex;
		align-items: flex-start;
		cursor: pointer;
		flex: 1;
		min-width: 0;
	}

	.ml-step--disabled {
		cursor: not-allowed;
		opacity: var(--ml-step-disabled-opacity);
	}

	.ml-step:focus-visible {
		outline: 2px solid var(--ml-step-focus-color);
		outline-offset: 2px;
		border-radius: var(--ml-step-focus-radius);
	}

	/* ============================================
	   HORIZONTAL LAYOUT
	   ============================================ */
	.ml-step--horizontal {
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.ml-step--horizontal .ml-step__track {
		display: flex;
		align-items: center;
		width: 100%;
		margin-bottom: var(--ml-step-track-gap);
	}

	.ml-step--horizontal .ml-step__connector-before,
	.ml-step--horizontal .ml-step__connector-after {
		flex: 1;
		height: var(--ml-step-connector-thickness);
	}

	.ml-step--horizontal .ml-step__connector--hidden {
		visibility: hidden;
	}

	/* ============================================
	   VERTICAL LAYOUT
	   ============================================ */
	.ml-step--vertical {
		flex-direction: row;
		align-items: stretch;
		text-align: left;
	}

	.ml-step--vertical .ml-step__track {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: var(--ml-step-track-gap);
	}

	.ml-step--vertical .ml-step__connector-before,
	.ml-step--vertical .ml-step__connector-after {
		flex: 1;
		width: var(--ml-step-connector-thickness);
		min-height: 12px;
	}

	.ml-step--vertical .ml-step__connector--hidden {
		visibility: hidden;
	}

	.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-step-vertical-content-padding);
	}

	.ml-step--vertical.ml-step--last .ml-step__content {
		padding-bottom: 0;
	}

	/* ============================================
	   CONNECTORS
	   ============================================ */
	.ml-step__connector-before,
	.ml-step__connector-after {
		transition: background-color var(--ml-step-connector-transition);
	}

	/* Solid connector */
	.ml-step__connector--solid {
		background-color: var(--ml-step-connector-color);
	}

	/* Dotted connector */
	.ml-step__connector--dotted {
		background-color: transparent !important;
	}

	/* Horizontal dotted */
	.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-step-connector-color) 0,
			var(--ml-step-connector-color) 4px,
			transparent 4px,
			transparent 8px
		);
		background-size: 100% 2px;
		background-repeat: no-repeat;
		background-position: center;
	}

	/* Vertical dotted */
	.ml-step--vertical .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to bottom,
			var(--ml-step-connector-color) 0,
			var(--ml-step-connector-color) 4px,
			transparent 4px,
			transparent 8px
		);
		background-size: 2px 100%;
		background-repeat: no-repeat;
		background-position: center;
	}

	/* Connector coloring - Completed: both halves colored */
	.ml-step--completed.ml-step--primary .ml-step__connector--solid {
		background-color: var(--ml-color-primary);
	}
	.ml-step--completed.ml-step--success .ml-step__connector--solid {
		background-color: var(--ml-color-success);
	}
	.ml-step--completed.ml-step--primary .ml-step--horizontal .ml-step__connector--dotted,
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

	/* Current: before-connector colored, after-connector gray */
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
	   INDICATOR BASE
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
			background-color var(--ml-step-indicator-transition),
			border-color var(--ml-step-indicator-transition),
			color var(--ml-step-indicator-transition);
	}

	/* ============================================
	   NUMBERED VARIANT
	   ============================================ */
	.ml-step__indicator-inner--numbered {
		width: var(--ml-step-indicator-size);
		height: var(--ml-step-indicator-size);
		border-radius: 50%;
		font-size: var(--ml-step-indicator-font-size);
		font-weight: var(--ml-step-indicator-font-weight);
		font-family: var(--ml-step-indicator-font-family);
	}

	/* Numbered - Upcoming */
	.ml-step--upcoming .ml-step__indicator-inner--numbered {
		border: var(--ml-step-indicator-border-width) solid var(--ml-step-upcoming-border-color);
		color: var(--ml-step-upcoming-color);
		background-color: var(--ml-step-upcoming-bg);
	}

	/* Numbered - Current (primary) */
	.ml-step--current.ml-step--primary .ml-step__indicator-inner--numbered {
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-color-primary);
		background-color: var(--ml-step-upcoming-bg);
	}

	/* Numbered - Current (success) */
	.ml-step--current.ml-step--success .ml-step__indicator-inner--numbered {
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-color-success);
		background-color: var(--ml-step-upcoming-bg);
	}

	/* Numbered - Completed (primary) */
	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-primary);
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-step-completed-indicator-text);
	}

	/* Numbered - Completed (success) */
	.ml-step--completed.ml-step--success .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-success);
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-step-completed-indicator-text);
	}

	/* ============================================
	   CIRCLES VARIANT
	   ============================================ */
	.ml-step__indicator-inner--circles {
		width: var(--ml-step-indicator-size);
		height: var(--ml-step-indicator-size);
		border-radius: 50%;
	}

	.ml-step__indicator-dot {
		width: var(--ml-step-dot-size);
		height: var(--ml-step-dot-size);
		border-radius: 50%;
		transition: background-color var(--ml-step-connector-transition);
	}

	/* Circles - Upcoming */
	.ml-step--upcoming .ml-step__indicator-inner--circles {
		border: var(--ml-step-indicator-border-width) solid var(--ml-step-upcoming-border-color);
		background-color: var(--ml-step-upcoming-bg);
	}
	.ml-step--upcoming .ml-step__indicator-dot {
		background-color: var(--ml-step-upcoming-border-color);
	}

	/* Circles - Current (primary) */
	.ml-step--current.ml-step--primary .ml-step__indicator-inner--circles {
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-primary);
		background-color: var(--ml-step-upcoming-bg);
	}
	.ml-step--current.ml-step--primary .ml-step__indicator-dot {
		background-color: var(--ml-color-primary);
	}

	/* Circles - Current (success) */
	.ml-step--current.ml-step--success .ml-step__indicator-inner--circles {
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-success);
		background-color: var(--ml-step-upcoming-bg);
	}
	.ml-step--current.ml-step--success .ml-step__indicator-dot {
		background-color: var(--ml-color-success);
	}

	/* Circles - Completed (primary) */
	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-primary);
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-primary);
		color: var(--ml-step-completed-indicator-text);
	}

	/* Circles - Completed (success) */
	.ml-step--completed.ml-step--success .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-success);
		border: var(--ml-step-indicator-border-width) solid var(--ml-color-success);
		color: var(--ml-step-completed-indicator-text);
	}

	/* ============================================
	   ICONS VARIANT
	   ============================================ */
	.ml-step__indicator-inner--icons {
		width: var(--ml-step-icon-indicator-size);
		height: var(--ml-step-icon-indicator-size);
		border-radius: var(--ml-step-icon-indicator-radius);
		border: var(--ml-step-indicator-border-width) solid var(--ml-step-upcoming-border-color);
	}

	/* Icons - Upcoming */
	.ml-step--upcoming .ml-step__indicator-inner--icons {
		border-color: var(--ml-step-upcoming-border-color);
		background-color: var(--ml-step-upcoming-bg);
		color: var(--ml-step-icon-upcoming-color);
	}

	/* Icons - Current */
	.ml-step--current .ml-step__indicator-inner--icons {
		border-color: var(--ml-step-icon-current-border-color);
		background-color: var(--ml-step-upcoming-bg);
		color: var(--ml-step-icon-current-color);
	}

	/* Icons - Completed (primary) */
	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--icons {
		border-color: var(--ml-color-primary);
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	/* Icons - Completed (success) */
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
		height: var(--ml-step-bar-height);
		border-radius: var(--ml-step-bar-radius);
		background-color: var(--ml-step-bar-color);
		margin-bottom: var(--ml-step-track-gap);
		transition: background-color var(--ml-step-connector-transition);
	}

	/* Bar - Current & Completed (primary) */
	.ml-step--bar.ml-step--current.ml-step--primary .ml-step__bar,
	.ml-step--bar.ml-step--completed.ml-step--primary .ml-step__bar {
		background-color: var(--ml-color-primary);
	}

	/* Bar - Current & Completed (success) */
	.ml-step--bar.ml-step--current.ml-step--success .ml-step__bar,
	.ml-step--bar.ml-step--completed.ml-step--success .ml-step__bar {
		background-color: var(--ml-color-success);
	}

	/* Bar - Vertical */
	.ml-step--bar.ml-step--vertical {
		flex-direction: row;
	}

	.ml-step--bar.ml-step--vertical .ml-step__bar {
		width: var(--ml-step-bar-height);
		height: auto;
		min-height: 40px;
		margin-bottom: 0;
		margin-right: var(--ml-step-track-gap);
	}

	.ml-step--bar.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-step-vertical-content-padding);
	}

	.ml-step--bar.ml-step--vertical.ml-step--last .ml-step__content {
		padding-bottom: 0;
	}

	/* ============================================
	   COMPACT / DOTS MODE
	   ============================================ */
	.ml-step--compact {
		flex: 0 0 auto;
		min-width: auto;
		align-items: center;
		justify-content: center;
	}

	.ml-step__dot {
		width: var(--ml-step-compact-dot-size);
		height: var(--ml-step-compact-dot-size);
		border-radius: 50%;
		background-color: var(--ml-step-compact-dot-color);
		transition: background-color var(--ml-step-connector-transition);
	}

	.ml-step--compact.ml-step--current.ml-step--primary .ml-step__dot {
		background-color: var(--ml-color-primary);
	}
	.ml-step--compact.ml-step--current.ml-step--success .ml-step__dot {
		background-color: var(--ml-color-success);
	}
	.ml-step--compact.ml-step--completed.ml-step--primary .ml-step__dot {
		background-color: var(--ml-color-primary);
	}
	.ml-step--compact.ml-step--completed.ml-step--success .ml-step__dot {
		background-color: var(--ml-color-success);
	}

	/* ============================================
	   CONTENT (LABEL + DESCRIPTION)
	   ============================================ */
	.ml-step__content {
		display: flex;
		flex-direction: column;
		gap: var(--ml-step-content-gap);
		min-width: 0;
	}

	.ml-step__label {
		font-family: var(--ml-step-label-font-family);
		font-size: var(--ml-step-label-font-size);
		font-weight: var(--ml-step-label-font-weight);
		color: var(--ml-step-label-color);
		line-height: var(--ml-step-label-line-height);
		transition: color var(--ml-step-connector-transition);
	}

	.ml-step--upcoming .ml-step__label {
		color: var(--ml-step-label-upcoming-color);
	}

	.ml-step--current.ml-step--primary .ml-step__label {
		color: var(--ml-color-primary);
	}

	.ml-step--current.ml-step--success .ml-step__label {
		color: var(--ml-color-success);
	}

	.ml-step__description {
		font-family: var(--ml-step-desc-font-family);
		font-size: var(--ml-step-desc-font-size);
		color: var(--ml-step-desc-color);
		line-height: var(--ml-step-desc-line-height);
	}
`;
