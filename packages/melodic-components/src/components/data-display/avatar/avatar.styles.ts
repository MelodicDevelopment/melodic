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
		background-color: var(--ml-gray-200);
		color: var(--ml-gray-600);
		font-weight: var(--ml-font-medium);
		vertical-align: middle;
		border-radius: var(--ml-radius-full);
	}

	.ml-avatar--rounded {
		border-radius: var(--ml-radius-lg);
	}

	/* Sizes */
	.ml-avatar--xs {
		width: 1.5rem;
		height: 1.5rem;
		font-size: var(--ml-text-xs);
	}

	.ml-avatar--sm {
		width: 2rem;
		height: 2rem;
		font-size: var(--ml-text-xs);
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
	}

	/* Fallback icon */
	.ml-avatar__fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 60%;
		height: 60%;
	}

	.ml-avatar__fallback svg {
		width: 100%;
		height: 100%;
	}
`;
