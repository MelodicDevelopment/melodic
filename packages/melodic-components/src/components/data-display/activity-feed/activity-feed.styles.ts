import { css } from '@melodicdev/core';

export const activityFeedStyles = () => css`
	:host {
		display: block;

		/* ── Activity Feed: list divider ── */
		--ml-activity-feed-divider-width: var(--ml-border);
		--ml-activity-feed-divider-color: var(--ml-color-border);
	}

	.ml-activity-feed {
		display: flex;
		flex-direction: column;
	}

	/* List variant: dividers between items */
	.ml-activity-feed--list ::slotted(ml-activity-feed-item:not(:last-of-type)) {
		border-bottom: var(--ml-activity-feed-divider-width) solid var(--ml-activity-feed-divider-color);
	}

	/* Timeline variant: connector line, no dividers */
	.ml-activity-feed--timeline {
		--_ml-af-line-display: block;
	}

	.ml-activity-feed--timeline ::slotted(ml-activity-feed-item:last-of-type) {
		--_ml-af-line-display: none;
	}
`;
