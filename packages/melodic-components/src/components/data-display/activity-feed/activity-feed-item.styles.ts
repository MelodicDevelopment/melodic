import { css } from '@melodicdev/core';

export const activityFeedItemStyles = () => css`
	:host {
		display: block;

		/* ── Activity Feed Item: spacing ── */
		--ml-activity-feed-item-padding: var(--ml-space-4) 0;
		--ml-activity-feed-item-gap: var(--ml-space-3);

		/* ── Activity Feed Item: connector ── */
		--ml-activity-feed-item-connector-color: var(--ml-color-border);
		--ml-activity-feed-item-connector-width: 2px;
		--ml-activity-feed-item-connector-radius: var(--ml-radius-full);
		--ml-activity-feed-item-connector-spacing: var(--ml-space-2);

		/* ── Activity Feed Item: name ── */
		--ml-activity-feed-item-name-font: var(--ml-font-sans);
		--ml-activity-feed-item-name-size: var(--ml-text-sm);
		--ml-activity-feed-item-name-weight: var(--ml-font-semibold);
		--ml-activity-feed-item-name-color: var(--ml-color-text);

		/* ── Activity Feed Item: timestamp ── */
		--ml-activity-feed-item-timestamp-font: var(--ml-font-sans);
		--ml-activity-feed-item-timestamp-size: var(--ml-text-xs);
		--ml-activity-feed-item-timestamp-color: var(--ml-color-text-tertiary);

		/* ── Activity Feed Item: subtitle ── */
		--ml-activity-feed-item-subtitle-font: var(--ml-font-sans);
		--ml-activity-feed-item-subtitle-size: var(--ml-text-xs);
		--ml-activity-feed-item-subtitle-color: var(--ml-color-text-secondary);

		/* ── Activity Feed Item: description ── */
		--ml-activity-feed-item-description-font: var(--ml-font-sans);
		--ml-activity-feed-item-description-size: var(--ml-text-sm);
		--ml-activity-feed-item-description-color: var(--ml-color-text-secondary);
		--ml-activity-feed-item-description-line-height: var(--ml-leading-relaxed);

		/* ── Activity Feed Item: description link ── */
		--ml-activity-feed-item-link-color: var(--ml-color-primary);
		--ml-activity-feed-item-link-weight: var(--ml-font-medium);

		/* ── Activity Feed Item: indicator ── */
		--ml-activity-feed-item-indicator-size: 8px;
		--ml-activity-feed-item-indicator-radius: var(--ml-radius-full);

		/* ── Activity Feed Item: indicator colors ── */
		--ml-activity-feed-item-indicator-gray: var(--ml-color-text-tertiary);
		--ml-activity-feed-item-indicator-primary: var(--ml-color-primary);
		--ml-activity-feed-item-indicator-success: var(--ml-color-success);
		--ml-activity-feed-item-indicator-warning: var(--ml-color-warning);
		--ml-activity-feed-item-indicator-error: var(--ml-color-error);

		padding: var(--ml-activity-feed-item-padding);
	}

	.ml-afi {
		display: flex;
		gap: var(--ml-activity-feed-item-gap);
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
		width: var(--ml-activity-feed-item-connector-width);
		margin-top: var(--ml-activity-feed-item-connector-spacing);
		background-color: var(--ml-activity-feed-item-connector-color);
		border-radius: var(--ml-activity-feed-item-connector-radius);
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
		font-family: var(--ml-activity-feed-item-name-font);
		font-size: var(--ml-activity-feed-item-name-size);
		font-weight: var(--ml-activity-feed-item-name-weight);
		color: var(--ml-activity-feed-item-name-color);
	}

	.ml-afi__timestamp {
		font-family: var(--ml-activity-feed-item-timestamp-font);
		font-size: var(--ml-activity-feed-item-timestamp-size);
		color: var(--ml-activity-feed-item-timestamp-color);
	}

	.ml-afi__subtitle {
		font-family: var(--ml-activity-feed-item-subtitle-font);
		font-size: var(--ml-activity-feed-item-subtitle-size);
		color: var(--ml-activity-feed-item-subtitle-color);
		margin-top: var(--ml-space-0-5);
	}

	.ml-afi__description {
		font-family: var(--ml-activity-feed-item-description-font);
		font-size: var(--ml-activity-feed-item-description-size);
		color: var(--ml-activity-feed-item-description-color);
		line-height: var(--ml-activity-feed-item-description-line-height);
		margin-top: var(--ml-space-1);
	}

	.ml-afi__description ::slotted(a) {
		color: var(--ml-activity-feed-item-link-color);
		text-decoration: none;
		font-weight: var(--ml-activity-feed-item-link-weight);
	}

	.ml-afi__description ::slotted(a:hover) {
		text-decoration: underline;
	}

	.ml-afi__description ::slotted(strong) {
		font-weight: var(--ml-font-semibold);
		color: var(--ml-activity-feed-item-name-color);
	}

	.ml-afi__content {
		margin-top: var(--ml-space-2);
	}

	/* Indicator dot */
	.ml-afi__indicator {
		width: var(--ml-activity-feed-item-indicator-size);
		height: var(--ml-activity-feed-item-indicator-size);
		border-radius: var(--ml-activity-feed-item-indicator-radius);
		flex-shrink: 0;
		background-color: var(--ml-afi-indicator-bg);
	}

	.ml-afi__indicator--gray {
		background-color: var(--ml-activity-feed-item-indicator-gray);
	}

	.ml-afi__indicator--primary {
		background-color: var(--ml-activity-feed-item-indicator-primary);
	}

	.ml-afi__indicator--success {
		background-color: var(--ml-activity-feed-item-indicator-success);
	}

	.ml-afi__indicator--warning {
		background-color: var(--ml-activity-feed-item-indicator-warning);
	}

	.ml-afi__indicator--error {
		background-color: var(--ml-activity-feed-item-indicator-error);
	}
`;
