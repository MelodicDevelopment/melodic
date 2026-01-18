import { css } from '@melodicdev/core';

export const avatarStyles = () => css`
	:host {
		display: inline-block;
	}

	.ml-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background-color: var(--ml-color-surface-raised);
		color: var(--ml-color-text-muted);
		font-weight: var(--ml-font-semibold);
		vertical-align: middle;
		border-radius: var(--ml-radius-full);
		border: 2px solid var(--ml-color-surface);
		box-shadow: var(--ml-shadow-xs);
	}

	.ml-avatar--rounded {
		border-radius: var(--ml-radius);
	}

	/* Sizes */
	.ml-avatar--xs {
		width: 1.5rem;
		height: 1.5rem;
		font-size: 0.625rem;
		border-width: 1px;
	}

	.ml-avatar--sm {
		width: 2rem;
		height: 2rem;
		font-size: var(--ml-text-xs);
		border-width: 1.5px;
	}

	.ml-avatar--md {
		width: 2.5rem;
		height: 2.5rem;
		font-size: var(--ml-text-sm);
	}

	.ml-avatar--lg {
		width: 3rem;
		height: 3rem;
		font-size: var(--ml-text-base);
	}

	.ml-avatar--xl {
		width: 4rem;
		height: 4rem;
		font-size: var(--ml-text-xl);
		border-width: 3px;
	}

	.ml-avatar--2xl {
		width: 5rem;
		height: 5rem;
		font-size: var(--ml-text-2xl);
		border-width: 3px;
	}

	/* Image */
	.ml-avatar__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Initials */
	.ml-avatar__initials {
		text-transform: uppercase;
		user-select: none;
		letter-spacing: -0.025em;
	}

	/* Fallback icon */
	.ml-avatar__fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 60%;
		height: 60%;
		color: var(--ml-color-text-subtle);
	}

	.ml-avatar__fallback svg {
		width: 100%;
		height: 100%;
	}
`;
