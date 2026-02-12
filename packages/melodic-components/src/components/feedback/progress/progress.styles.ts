import { css } from '@melodicdev/core';

export const progressStyles = () => css`
	:host {
		display: block;
	}

	/* ===================== LINEAR ===================== */

	.ml-progress__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--ml-space-2);
	}

	.ml-progress__label {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
	}

	.ml-progress__value {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
	}

	.ml-progress__value--bottom {
		display: block;
		margin-top: var(--ml-space-2);
	}

	/* Bar row for label-right layout */
	.ml-progress__bar-row {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
	}

	.ml-progress__track-wrapper {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.ml-progress__track {
		width: 100%;
		background-color: var(--ml-color-surface-sunken);
		border-radius: var(--ml-radius-full);
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
		border-radius: var(--ml-radius-full);
		transition: width var(--ml-duration-300) var(--ml-ease-out);
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
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-inverse);
		background-color: var(--ml-color-text);
		padding: var(--ml-space-1) var(--ml-space-2);
		border-radius: var(--ml-radius-md);
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
		border-top: 5px solid var(--ml-color-text);
	}

	.ml-progress__floating-arrow--up {
		border-bottom: 5px solid var(--ml-color-text);
	}

	/* Linear color variants */
	.ml-progress--primary .ml-progress__fill {
		background-color: var(--ml-color-primary);
	}

	.ml-progress--success .ml-progress__fill {
		background-color: var(--ml-color-success);
	}

	.ml-progress--warning .ml-progress__fill {
		background-color: var(--ml-color-warning);
	}

	.ml-progress--error .ml-progress__fill {
		background-color: var(--ml-color-error);
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
		stroke: var(--ml-color-surface-sunken);
	}

	.ml-progress-circle__fill {
		transition: stroke-dashoffset var(--ml-duration-300) var(--ml-ease-out);
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
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: 1;
	}

	.ml-progress-circle--md .ml-progress-circle__value {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: 1;
	}

	.ml-progress-circle--lg .ml-progress-circle__value {
		font-size: var(--ml-text-2xl);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: 1;
	}

	.ml-progress-circle__label {
		font-size: var(--ml-text-xs);
		color: var(--ml-color-text-muted);
		margin-top: var(--ml-space-0-5);
		line-height: 1;
	}

	.ml-progress-circle--lg .ml-progress-circle__label {
		font-size: var(--ml-text-sm);
		margin-top: var(--ml-space-1);
	}

	/* Circle color variants */
	.ml-progress-circle--primary .ml-progress-circle__fill {
		stroke: var(--ml-color-primary);
	}

	.ml-progress-circle--success .ml-progress-circle__fill {
		stroke: var(--ml-color-success);
	}

	.ml-progress-circle--warning .ml-progress-circle__fill {
		stroke: var(--ml-color-warning);
	}

	.ml-progress-circle--error .ml-progress-circle__fill {
		stroke: var(--ml-color-error);
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
		stroke: var(--ml-color-surface-sunken);
	}

	.ml-progress-half__fill {
		transition: stroke-dashoffset var(--ml-duration-300) var(--ml-ease-out);
	}

	.ml-progress-half__center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		text-align: center;
		padding-bottom: var(--ml-space-1);
	}

	.ml-progress-half--sm .ml-progress-half__value {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: 1;
	}

	.ml-progress-half--md .ml-progress-half__value {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: 1;
	}

	.ml-progress-half--lg .ml-progress-half__value {
		font-size: var(--ml-text-2xl);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: 1;
	}

	.ml-progress-half__label {
		font-size: var(--ml-text-xs);
		color: var(--ml-color-text-muted);
		margin-top: var(--ml-space-0-5);
		line-height: 1;
	}

	.ml-progress-half--lg .ml-progress-half__label {
		font-size: var(--ml-text-sm);
	}

	/* Half circle color variants */
	.ml-progress-half--primary .ml-progress-half__fill {
		stroke: var(--ml-color-primary);
	}

	.ml-progress-half--success .ml-progress-half__fill {
		stroke: var(--ml-color-success);
	}

	.ml-progress-half--warning .ml-progress-half__fill {
		stroke: var(--ml-color-warning);
	}

	.ml-progress-half--error .ml-progress-half__fill {
		stroke: var(--ml-color-error);
	}
`;
