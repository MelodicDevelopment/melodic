import { css } from '@melodicdev/core';

export const stepsStyles = () => css`
	:host {
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
		gap: var(--ml-space-3);
		justify-content: center;
		align-items: center;
	}

	.ml-steps__compact-label {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		text-align: center;
		margin-top: var(--ml-space-3);
	}

	/* ============================================
	   PANELS
	   ============================================ */
	.ml-steps__panels {
		padding-top: var(--ml-space-6);
	}

	.ml-steps--compact .ml-steps__panels {
		padding-top: var(--ml-space-4);
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
		opacity: 0.5;
	}

	.ml-step:focus-visible {
		outline: 2px solid var(--ml-color-primary);
		outline-offset: 2px;
		border-radius: var(--ml-radius);
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
		margin-bottom: var(--ml-space-3);
	}

	.ml-step--horizontal .ml-step__connector-before,
	.ml-step--horizontal .ml-step__connector-after {
		flex: 1;
		height: 2px;
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
		margin-right: var(--ml-space-3);
	}

	.ml-step--vertical .ml-step__connector-before,
	.ml-step--vertical .ml-step__connector-after {
		flex: 1;
		width: 2px;
		min-height: 12px;
	}

	.ml-step--vertical .ml-step__connector--hidden {
		visibility: hidden;
	}

	.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-space-6);
	}

	.ml-step--vertical.ml-step--last .ml-step__content {
		padding-bottom: 0;
	}

	/* Connectors */
	.ml-step__connector-before,
	.ml-step__connector-after {
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-step__connector--solid {
		background-color: var(--ml-color-border);
	}

	.ml-step__connector--dotted {
		background-color: transparent !important;
	}

	.ml-step--horizontal .ml-step__connector--dotted {
		background-image: repeating-linear-gradient(
			to right,
			var(--ml-color-border) 0,
			var(--ml-color-border) 4px,
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
			var(--ml-color-border) 0,
			var(--ml-color-border) 4px,
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
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	/* Numbered */
	.ml-step__indicator-inner--numbered {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		font-family: var(--ml-font-sans);
	}

	.ml-step--upcoming .ml-step__indicator-inner--numbered {
		border: 2px solid var(--ml-color-border);
		color: var(--ml-color-text-secondary);
		background-color: var(--ml-color-surface);
	}

	.ml-step--current.ml-step--primary .ml-step__indicator-inner--numbered {
		border: 2px solid var(--ml-color-primary);
		color: var(--ml-color-primary);
		background-color: var(--ml-color-surface);
	}

	.ml-step--current.ml-step--success .ml-step__indicator-inner--numbered {
		border: 2px solid var(--ml-color-success);
		color: var(--ml-color-success);
		background-color: var(--ml-color-surface);
	}

	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-primary);
		border: 2px solid var(--ml-color-primary);
		color: #fff;
	}

	.ml-step--completed.ml-step--success .ml-step__indicator-inner--numbered {
		background-color: var(--ml-color-success);
		border: 2px solid var(--ml-color-success);
		color: #fff;
	}

	/* Circles */
	.ml-step__indicator-inner--circles {
		width: 32px;
		height: 32px;
		border-radius: 50%;
	}

	.ml-step__indicator-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-step--upcoming .ml-step__indicator-inner--circles {
		border: 2px solid var(--ml-color-border);
		background-color: var(--ml-color-surface);
	}
	.ml-step--upcoming .ml-step__indicator-dot {
		background-color: var(--ml-color-border);
	}

	.ml-step--current.ml-step--primary .ml-step__indicator-inner--circles {
		border: 2px solid var(--ml-color-primary);
		background-color: var(--ml-color-surface);
	}
	.ml-step--current.ml-step--primary .ml-step__indicator-dot {
		background-color: var(--ml-color-primary);
	}

	.ml-step--current.ml-step--success .ml-step__indicator-inner--circles {
		border: 2px solid var(--ml-color-success);
		background-color: var(--ml-color-surface);
	}
	.ml-step--current.ml-step--success .ml-step__indicator-dot {
		background-color: var(--ml-color-success);
	}

	.ml-step--completed.ml-step--primary .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-primary);
		border: 2px solid var(--ml-color-primary);
		color: #fff;
	}

	.ml-step--completed.ml-step--success .ml-step__indicator-inner--circles {
		background-color: var(--ml-color-success);
		border: 2px solid var(--ml-color-success);
		color: #fff;
	}

	/* Icons */
	.ml-step__indicator-inner--icons {
		width: 40px;
		height: 40px;
		border-radius: var(--ml-radius-lg);
		border: 2px solid var(--ml-color-border);
	}

	.ml-step--upcoming .ml-step__indicator-inner--icons {
		border-color: var(--ml-color-border);
		background-color: var(--ml-color-surface);
		color: var(--ml-color-text-muted);
	}

	.ml-step--current .ml-step__indicator-inner--icons {
		border-color: var(--ml-color-text);
		background-color: var(--ml-color-surface);
		color: var(--ml-color-text);
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
		height: 4px;
		border-radius: 2px;
		background-color: var(--ml-color-border);
		margin-bottom: var(--ml-space-3);
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
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
		width: 4px;
		height: auto;
		min-height: 40px;
		margin-bottom: 0;
		margin-right: var(--ml-space-3);
	}

	.ml-step--bar.ml-step--vertical .ml-step__content {
		padding-bottom: var(--ml-space-6);
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
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background-color: var(--ml-color-border);
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
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
		gap: var(--ml-space-1);
		min-width: 0;
	}

	.ml-step__label {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
		transition: color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-step--upcoming .ml-step__label {
		color: var(--ml-color-text-secondary);
	}

	.ml-step--current.ml-step--primary .ml-step__label {
		color: var(--ml-color-primary);
	}

	.ml-step--current.ml-step--success .ml-step__label {
		color: var(--ml-color-success);
	}

	.ml-step__description {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-xs);
		color: var(--ml-color-text-muted);
		line-height: var(--ml-leading-normal);
	}

	/* ============================================
	   SLOTTED STEP STYLING
	   ============================================ */
	::slotted(ml-step) {
		flex: 1;
		min-width: 0;
	}
`;
