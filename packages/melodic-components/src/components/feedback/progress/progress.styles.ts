import { css } from '@melodicdev/core';

export const progressStyles = () => css`
	:host {
		display: block;

		/* ---- Linear ---- */

		/* Track */
		--ml-progress-track-color: var(--ml-color-surface-sunken);
		--ml-progress-track-radius: var(--ml-radius-full);
		/* Fill */
		--ml-progress-fill-color: var(--ml-color-primary);
		--ml-progress-fill-radius: var(--ml-radius-full);

		/* Label / value text */
		--ml-progress-label-font-size: var(--ml-text-sm);
		--ml-progress-label-font-weight: var(--ml-font-medium);
		--ml-progress-label-color: var(--ml-color-text);

		/* Floating tooltip */
		--ml-progress-floating-font-size: var(--ml-text-xs);
		--ml-progress-floating-font-weight: var(--ml-font-medium);
		--ml-progress-floating-color: var(--ml-color-text-inverse);
		--ml-progress-floating-bg: var(--ml-color-text);
		--ml-progress-floating-radius: var(--ml-radius-md);
		--ml-progress-floating-padding-y: var(--ml-space-1);
		--ml-progress-floating-padding-x: var(--ml-space-2);

		/* Spacing */
		--ml-progress-header-margin-bottom: var(--ml-space-2);
		--ml-progress-value-bottom-margin-top: var(--ml-space-2);
		--ml-progress-bar-row-gap: var(--ml-space-3);

		/* Transition */
		--ml-progress-transition-duration: var(--ml-duration-300);
		--ml-progress-transition-easing: var(--ml-ease-out);

		/* ---- Circle ---- */

		--ml-progress-circle-track-color: var(--ml-color-surface-sunken);
		--ml-progress-circle-fill-color: var(--ml-color-primary);
		--ml-progress-circle-value-font-weight: var(--ml-font-semibold);
		--ml-progress-circle-value-color: var(--ml-color-text);
		--ml-progress-circle-label-font-size: var(--ml-text-xs);
		--ml-progress-circle-label-color: var(--ml-color-text-muted);
		--ml-progress-circle-label-margin-top: var(--ml-space-0-5);

		/* ---- Half circle ---- */

		--ml-progress-half-track-color: var(--ml-color-surface-sunken);
		--ml-progress-half-fill-color: var(--ml-color-primary);
		--ml-progress-half-value-font-weight: var(--ml-font-semibold);
		--ml-progress-half-value-color: var(--ml-color-text);
		--ml-progress-half-label-font-size: var(--ml-text-xs);
		--ml-progress-half-label-color: var(--ml-color-text-muted);
		--ml-progress-half-label-margin-top: var(--ml-space-0-5);
		--ml-progress-half-center-padding-bottom: var(--ml-space-1);
	}

	/* ===================== LINEAR ===================== */

	.ml-progress__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--ml-progress-header-margin-bottom);
	}

	.ml-progress__label {
		font-size: var(--ml-progress-label-font-size);
		font-weight: var(--ml-progress-label-font-weight);
		color: var(--ml-progress-label-color);
	}

	.ml-progress__value {
		font-size: var(--ml-progress-label-font-size);
		font-weight: var(--ml-progress-label-font-weight);
		color: var(--ml-progress-label-color);
	}

	.ml-progress__value--bottom {
		display: block;
		margin-top: var(--ml-progress-value-bottom-margin-top);
	}

	/* Bar row for label-right layout */
	.ml-progress__bar-row {
		display: flex;
		align-items: center;
		gap: var(--ml-progress-bar-row-gap);
	}

	.ml-progress__track-wrapper {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.ml-progress__track {
		width: 100%;
		background-color: var(--ml-progress-track-color);
		border-radius: var(--ml-progress-track-radius);
		overflow: hidden;
	}

	.ml-progress--sm .ml-progress__track {
		height: 4px;
	}

	.ml-progress--md .ml-progress__track {
		height: 8px;
	}

	.ml-progress--lg .ml-progress__track {
		height: 12px;
	}

	.ml-progress__fill {
		height: 100%;
		background-color: var(--ml-progress-fill-color);
		border-radius: var(--ml-progress-fill-radius);
		transition: width var(--ml-progress-transition-duration) var(--ml-progress-transition-easing);
	}

	/* Floating label */
	.ml-progress__floating {
		position: absolute;
		left: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 1;
	}

	.ml-progress__floating--top {
		bottom: calc(100% + var(--ml-space-2));
	}

	.ml-progress__floating--bottom {
		top: calc(100% + var(--ml-space-2));
	}

	.ml-progress__floating-value {
		font-size: var(--ml-progress-floating-font-size);
		font-weight: var(--ml-progress-floating-font-weight);
		color: var(--ml-progress-floating-color);
		background-color: var(--ml-progress-floating-bg);
		padding: var(--ml-progress-floating-padding-y) var(--ml-progress-floating-padding-x);
		border-radius: var(--ml-progress-floating-radius);
		white-space: nowrap;
		line-height: 1;
	}

	.ml-progress__floating-arrow {
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
	}

	.ml-progress__floating-arrow--down {
		border-top: 5px solid var(--ml-progress-floating-bg);
	}

	.ml-progress__floating-arrow--up {
		border-bottom: 5px solid var(--ml-progress-floating-bg);
	}

	/* Linear color variants */
	.ml-progress--primary .ml-progress__fill {
		--ml-progress-fill-color: var(--ml-color-primary);
	}

	.ml-progress--success .ml-progress__fill {
		--ml-progress-fill-color: var(--ml-color-success);
	}

	.ml-progress--warning .ml-progress__fill {
		--ml-progress-fill-color: var(--ml-color-warning);
	}

	.ml-progress--error .ml-progress__fill {
		--ml-progress-fill-color: var(--ml-color-error);
	}

	/* ===================== CIRCLE ===================== */

	.ml-progress-circle {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.ml-progress-circle__svg {
		display: block;
	}

	.ml-progress-circle__track {
		stroke: var(--ml-progress-circle-track-color);
	}

	.ml-progress-circle__fill {
		stroke: var(--ml-progress-circle-fill-color);
		transition: stroke-dashoffset var(--ml-progress-transition-duration) var(--ml-progress-transition-easing);
	}

	.ml-progress-circle__center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.ml-progress-circle--sm .ml-progress-circle__value {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-progress-circle-value-font-weight);
		color: var(--ml-progress-circle-value-color);
		line-height: 1;
	}

	.ml-progress-circle--md .ml-progress-circle__value {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-progress-circle-value-font-weight);
		color: var(--ml-progress-circle-value-color);
		line-height: 1;
	}

	.ml-progress-circle--lg .ml-progress-circle__value {
		font-size: var(--ml-text-2xl);
		font-weight: var(--ml-progress-circle-value-font-weight);
		color: var(--ml-progress-circle-value-color);
		line-height: 1;
	}

	.ml-progress-circle__label {
		font-size: var(--ml-progress-circle-label-font-size);
		color: var(--ml-progress-circle-label-color);
		margin-top: var(--ml-progress-circle-label-margin-top);
		line-height: 1;
	}

	.ml-progress-circle--lg .ml-progress-circle__label {
		font-size: var(--ml-text-sm);
		margin-top: var(--ml-space-1);
	}

	/* Circle color variants */
	.ml-progress-circle--primary .ml-progress-circle__fill {
		--ml-progress-circle-fill-color: var(--ml-color-primary);
	}

	.ml-progress-circle--success .ml-progress-circle__fill {
		--ml-progress-circle-fill-color: var(--ml-color-success);
	}

	.ml-progress-circle--warning .ml-progress-circle__fill {
		--ml-progress-circle-fill-color: var(--ml-color-warning);
	}

	.ml-progress-circle--error .ml-progress-circle__fill {
		--ml-progress-circle-fill-color: var(--ml-color-error);
	}

	/* ===================== HALF CIRCLE ===================== */

	.ml-progress-half {
		position: relative;
		display: inline-flex;
		align-items: flex-end;
		justify-content: center;
	}

	.ml-progress-half__svg {
		display: block;
	}

	.ml-progress-half__track {
		stroke: var(--ml-progress-half-track-color);
	}

	.ml-progress-half__fill {
		stroke: var(--ml-progress-half-fill-color);
		transition: stroke-dashoffset var(--ml-progress-transition-duration) var(--ml-progress-transition-easing);
	}

	.ml-progress-half__center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		text-align: center;
		padding-bottom: var(--ml-progress-half-center-padding-bottom);
	}

	.ml-progress-half--sm .ml-progress-half__value {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-progress-half-value-font-weight);
		color: var(--ml-progress-half-value-color);
		line-height: 1;
	}

	.ml-progress-half--md .ml-progress-half__value {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-progress-half-value-font-weight);
		color: var(--ml-progress-half-value-color);
		line-height: 1;
	}

	.ml-progress-half--lg .ml-progress-half__value {
		font-size: var(--ml-text-2xl);
		font-weight: var(--ml-progress-half-value-font-weight);
		color: var(--ml-progress-half-value-color);
		line-height: 1;
	}

	.ml-progress-half__label {
		font-size: var(--ml-progress-half-label-font-size);
		color: var(--ml-progress-half-label-color);
		margin-top: var(--ml-progress-half-label-margin-top);
		line-height: 1;
	}

	.ml-progress-half--lg .ml-progress-half__label {
		font-size: var(--ml-text-sm);
	}

	/* Half circle color variants */
	.ml-progress-half--primary .ml-progress-half__fill {
		--ml-progress-half-fill-color: var(--ml-color-primary);
	}

	.ml-progress-half--success .ml-progress-half__fill {
		--ml-progress-half-fill-color: var(--ml-color-success);
	}

	.ml-progress-half--warning .ml-progress-half__fill {
		--ml-progress-half-fill-color: var(--ml-color-warning);
	}

	.ml-progress-half--error .ml-progress-half__fill {
		--ml-progress-half-fill-color: var(--ml-color-error);
	}
`;
