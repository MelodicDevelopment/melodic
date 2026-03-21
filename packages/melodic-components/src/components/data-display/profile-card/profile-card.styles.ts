import { css } from '@melodicdev/core';

export const profileCardStyles = () => css`
	:host {
		display: block;
	}

	.ml-profile-card {
		background-color: var(--ml-profile-card-bg, var(--ml-color-surface));
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-lg);
	}

	/* Subtle gradient banner at top */
	.ml-profile-card__banner {
		height: var(--ml-profile-card-banner-height, 80px);
		border-radius: var(--ml-radius-lg) var(--ml-radius-lg) 0 0;
		background: linear-gradient(
			135deg,
			var(--ml-profile-card-banner-from, var(--ml-color-primary)),
			var(--ml-profile-card-banner-to, var(--ml-color-primary-hover, var(--ml-color-primary)))
		);
		opacity: var(--ml-profile-card-banner-opacity, 0.85);
	}

	/* Centered identity area */
	.ml-profile-card__identity {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 var(--ml-space-5) var(--ml-space-4);
		margin-top: calc(var(--ml-space-10) * -1);
		text-align: center;
	}

	.ml-profile-card__avatar {
		display: inline-block;
		margin-bottom: var(--ml-space-3);
		border-radius: var(--ml-radius-full);
		box-shadow: 0 0 0 4px var(--ml-profile-card-bg, var(--ml-color-surface)), 0 0 0 5px var(--ml-color-border), var(--ml-shadow-md);
		line-height: 0;
		position: relative;
		z-index: 1;
	}

	.ml-profile-card__avatar ml-avatar {
		display: block;
		--ml-avatar-border-color: var(--ml-color-border-muted, var(--ml-color-border));
	}

	.ml-profile-card__name {
		margin: 0;
		font-family: var(--ml-profile-card-name-font, 'Cormorant Garamond', 'Georgia', serif);
		font-size: var(--ml-text-xl);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
	}

	.ml-profile-card__subtitle {
		margin: var(--ml-space-1) 0 0;
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
	}

	/* Sections */
	.ml-profile-card__section {
		padding: var(--ml-space-4) var(--ml-space-5);
		border-top: var(--ml-border) solid var(--ml-color-border);
	}

	.ml-profile-card__section--hidden {
		display: none;
	}

	.ml-profile-card__section-label {
		width: 100%;
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: var(--ml-space-1);
	}

	/* Actions section */
	.ml-profile-card__actions {
		display: flex;
		justify-content: center;
		gap: var(--ml-space-3);
	}

	.ml-profile-card__actions.ml-profile-card__section--hidden {
		display: none;
	}

	/* Details section */
	.ml-profile-card__details {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-2);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
	}

	.ml-profile-card__details.ml-profile-card__section--hidden {
		display: none;
	}

	.ml-profile-card__details ::slotted(*) {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
	}

	/* Tags section */
	.ml-profile-card__tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--ml-space-2);
	}

	.ml-profile-card__tags.ml-profile-card__section--hidden {
		display: none;
	}

	/* Meta section */
	.ml-profile-card__meta {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-2);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
	}

	.ml-profile-card__meta.ml-profile-card__section--hidden {
		display: none;
	}
`;
