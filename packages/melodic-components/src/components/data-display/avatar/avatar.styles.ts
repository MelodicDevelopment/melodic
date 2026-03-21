import { css } from '@melodicdev/core';

export const avatarStyles = () => css`
	:host {
		display: inline-block;

		/* ── Avatar: colors ── */
		--ml-avatar-bg: var(--ml-color-surface-raised);
		--ml-avatar-color: var(--ml-color-text-muted);
		--ml-avatar-font-weight: var(--ml-font-semibold);
		--ml-avatar-border-color: var(--ml-color-surface);
		--ml-avatar-shadow: var(--ml-shadow-xs);
		--ml-avatar-radius: var(--ml-radius-full);

		/* ── Avatar: fallback icon ── */
		--ml-avatar-fallback-color: var(--ml-color-text-subtle);
	}

	.ml-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background-color: var(--ml-avatar-bg);
		color: var(--ml-avatar-color);
		font-weight: var(--ml-avatar-font-weight);
		vertical-align: middle;
		border-radius: var(--ml-avatar-radius);
		border: 2px solid var(--ml-avatar-border-color);
		box-shadow: var(--ml-avatar-shadow);
	}

	.ml-avatar--rounded {
		border-radius: var(--ml-radius);
	}

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

	.ml-avatar__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.ml-avatar__initials {
		text-transform: uppercase;
		user-select: none;
		letter-spacing: -0.025em;
	}

	.ml-avatar__fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 60%;
		height: 60%;
		color: var(--ml-avatar-fallback-color);
	}

	.ml-avatar__fallback svg {
		width: 100%;
		height: 100%;
	}
`;
