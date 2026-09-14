import { css } from '@melodicdev/core';

export const activityFeedItemStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-activity-feed-item-gap: var(--ml-space-3)
	 *
	 * Activity Feed Item: connector
	 * --ml-activity-feed-item-connector-color: var(--ml-color-border)
	 * --ml-activity-feed-item-connector-width: 2px
	 * --ml-activity-feed-item-connector-radius: var(--ml-radius-full)
	 * --ml-activity-feed-item-connector-spacing: var(--ml-space-2)
	 *
	 * Activity Feed Item: name
	 * --ml-activity-feed-item-name-font: var(--ml-font-sans)
	 * --ml-activity-feed-item-name-size: var(--ml-text-sm)
	 * --ml-activity-feed-item-name-weight: var(--ml-font-semibold)
	 * --ml-activity-feed-item-name-color: var(--ml-color-text)
	 *
	 * Activity Feed Item: timestamp
	 * --ml-activity-feed-item-timestamp-font: var(--ml-font-sans)
	 * --ml-activity-feed-item-timestamp-size: var(--ml-text-xs)
	 * --ml-activity-feed-item-timestamp-color: var(--ml-color-text-tertiary)
	 *
	 * Activity Feed Item: subtitle
	 * --ml-activity-feed-item-subtitle-font: var(--ml-font-sans)
	 * --ml-activity-feed-item-subtitle-size: var(--ml-text-xs)
	 * --ml-activity-feed-item-subtitle-color: var(--ml-color-text-secondary)
	 *
	 * Activity Feed Item: description
	 * --ml-activity-feed-item-description-font: var(--ml-font-sans)
	 * --ml-activity-feed-item-description-size: var(--ml-text-sm)
	 * --ml-activity-feed-item-description-color: var(--ml-color-text-secondary)
	 * --ml-activity-feed-item-description-line-height: var(--ml-leading-relaxed)
	 *
	 * Activity Feed Item: description link
	 * --ml-activity-feed-item-link-color: var(--ml-color-primary)
	 * --ml-activity-feed-item-link-weight: var(--ml-font-medium)
	 *
	 * Activity Feed Item: indicator
	 * --ml-activity-feed-item-indicator-size: 8px
	 * --ml-activity-feed-item-indicator-radius: var(--ml-radius-full)
	 *
	 * Activity Feed Item: indicator colors
	 * --ml-activity-feed-item-indicator-gray: var(--ml-color-text-tertiary)
	 * --ml-activity-feed-item-indicator-primary: var(--ml-color-primary)
	 * --ml-activity-feed-item-indicator-success: var(--ml-color-success)
	 * --ml-activity-feed-item-indicator-warning: var(--ml-color-warning)
	 * --ml-activity-feed-item-indicator-error: var(--ml-color-error)
	 *
	 * --ml-activity-feed-item-padding: var(--ml-space-4) 0
	 */

	:host {
		display: block;

		padding: var(--ml-activity-feed-item-padding, var(--ml-space-4) 0);
	}

	.ml-afi {
		display: flex;
		gap: var(--ml-activity-feed-item-gap, var(--ml-space-3));
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
		width: var(--ml-activity-feed-item-connector-width, 2px);
		margin-top: var(--ml-activity-feed-item-connector-spacing, var(--ml-space-2));
		background-color: var(--ml-activity-feed-item-connector-color, var(--ml-color-border));
		border-radius: var(--ml-activity-feed-item-connector-radius, var(--ml-radius-full));
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
		font-family: var(--ml-activity-feed-item-name-font, var(--ml-font-sans));
		font-size: var(--ml-activity-feed-item-name-size, var(--ml-text-sm));
		font-weight: var(--ml-activity-feed-item-name-weight, var(--ml-font-semibold));
		color: var(--ml-activity-feed-item-name-color, var(--ml-color-text));
	}

	.ml-afi__timestamp {
		font-family: var(--ml-activity-feed-item-timestamp-font, var(--ml-font-sans));
		font-size: var(--ml-activity-feed-item-timestamp-size, var(--ml-text-xs));
		color: var(--ml-activity-feed-item-timestamp-color, var(--ml-color-text-tertiary));
	}

	.ml-afi__subtitle {
		font-family: var(--ml-activity-feed-item-subtitle-font, var(--ml-font-sans));
		font-size: var(--ml-activity-feed-item-subtitle-size, var(--ml-text-xs));
		color: var(--ml-activity-feed-item-subtitle-color, var(--ml-color-text-secondary));
		margin-top: var(--ml-space-0-5);
	}

	.ml-afi__description {
		font-family: var(--ml-activity-feed-item-description-font, var(--ml-font-sans));
		font-size: var(--ml-activity-feed-item-description-size, var(--ml-text-sm));
		color: var(--ml-activity-feed-item-description-color, var(--ml-color-text-secondary));
		line-height: var(--ml-activity-feed-item-description-line-height, var(--ml-leading-relaxed));
		margin-top: var(--ml-space-1);
	}

	.ml-afi__description ::slotted(a) {
		color: var(--ml-activity-feed-item-link-color, var(--ml-color-primary));
		text-decoration: none;
		font-weight: var(--ml-activity-feed-item-link-weight, var(--ml-font-medium));
	}

	.ml-afi__description ::slotted(a:hover) {
		text-decoration: underline;
	}

	.ml-afi__description ::slotted(strong) {
		font-weight: var(--ml-font-semibold);
		color: var(--ml-activity-feed-item-name-color, var(--ml-color-text));
	}

	.ml-afi__content {
		margin-top: var(--ml-space-2);
	}

	.ml-afi__content--hidden {
		display: none;
	}

	/* Indicator dot */
	.ml-afi__indicator {
		width: var(--ml-activity-feed-item-indicator-size, 8px);
		height: var(--ml-activity-feed-item-indicator-size, 8px);
		border-radius: var(--ml-activity-feed-item-indicator-radius, var(--ml-radius-full));
		flex-shrink: 0;
		background-color: var(--ml-afi-indicator-bg);
	}

	.ml-afi__indicator--gray {
		background-color: var(--ml-activity-feed-item-indicator-gray, var(--ml-color-text-tertiary));
	}

	.ml-afi__indicator--primary {
		background-color: var(--ml-activity-feed-item-indicator-primary, var(--ml-color-primary));
	}

	.ml-afi__indicator--success {
		background-color: var(--ml-activity-feed-item-indicator-success, var(--ml-color-success));
	}

	.ml-afi__indicator--warning {
		background-color: var(--ml-activity-feed-item-indicator-warning, var(--ml-color-warning));
	}

	.ml-afi__indicator--error {
		background-color: var(--ml-activity-feed-item-indicator-error, var(--ml-color-error));
	}
`;
