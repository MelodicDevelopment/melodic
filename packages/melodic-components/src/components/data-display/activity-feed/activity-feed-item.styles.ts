import { css } from '@melodicdev/core';

export const activityFeedItemStyles = () => css`
	:host {
		display: block;
		padding: var(--ml-space-4) 0;
	}

	.ml-afi {
		display: flex;
		gap: var(--ml-space-3);
	}

	/* Left column: avatar + connector */
	.ml-afi__left {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
	}

	.ml-afi__avatar {
		position: relative;
		z-index: 1;
	}

	.ml-afi__connector {
		flex: 1;
		width: 2px;
		margin-top: var(--ml-space-2);
		background-color: var(--ml-color-border);
		border-radius: var(--ml-radius-full);
		display: var(--_ml-af-line-display, none);
	}

	/* Body */
	.ml-afi__body {
		flex: 1;
		min-width: 0;
	}

	.ml-afi__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-2);
	}

	.ml-afi__meta {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		flex-wrap: wrap;
	}

	.ml-afi__name {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
	}

	.ml-afi__timestamp {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-xs);
		color: var(--ml-color-text-tertiary);
	}

	.ml-afi__subtitle {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-xs);
		color: var(--ml-color-text-secondary);
		margin-top: var(--ml-space-0-5);
	}

	.ml-afi__description {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-relaxed);
		margin-top: var(--ml-space-1);
	}

	.ml-afi__description ::slotted(a) {
		color: var(--ml-color-primary);
		text-decoration: none;
		font-weight: var(--ml-font-medium);
	}

	.ml-afi__description ::slotted(a:hover) {
		text-decoration: underline;
	}

	.ml-afi__description ::slotted(strong) {
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
	}

	.ml-afi__content {
		margin-top: var(--ml-space-2);
	}

	/* Indicator dot */
	.ml-afi__indicator {
		width: 8px;
		height: 8px;
		border-radius: var(--ml-radius-full);
		flex-shrink: 0;
	}

	.ml-afi__indicator--gray {
		background-color: var(--ml-color-text-tertiary);
	}

	.ml-afi__indicator--primary {
		background-color: var(--ml-color-primary);
	}

	.ml-afi__indicator--success {
		background-color: var(--ml-color-success);
	}

	.ml-afi__indicator--warning {
		background-color: var(--ml-color-warning);
	}

	.ml-afi__indicator--error {
		background-color: var(--ml-color-error);
	}
`;
