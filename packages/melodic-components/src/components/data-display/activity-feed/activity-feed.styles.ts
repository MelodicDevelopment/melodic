import { css } from '@melodicdev/core';

export const activityFeedStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Activity Feed: list divider
	 * --ml-activity-feed-divider-width: var(--ml-border)
	 * --ml-activity-feed-divider-color: var(--ml-color-border)
	 */

	:host {
		display: block;
	}

	.ml-activity-feed {
		display: flex;
		flex-direction: column;
	}

	/* List variant: dividers between items */
	.ml-activity-feed--list ::slotted(ml-activity-feed-item:not(:last-of-type)) {
		border-bottom: var(--ml-activity-feed-divider-width, var(--ml-border)) solid var(--ml-activity-feed-divider-color, var(--ml-color-border));
	}

	/* Timeline variant: connector line, no dividers */
	.ml-activity-feed--timeline {
		--_ml-af-line-display: block;
	}

	.ml-activity-feed--timeline ::slotted(ml-activity-feed-item:last-of-type) {
		--_ml-af-line-display: none;
	}
`;
