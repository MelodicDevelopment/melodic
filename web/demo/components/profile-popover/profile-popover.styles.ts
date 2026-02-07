import { css } from '@melodicdev/core';

export const profilePopoverStyles = () => css`
	:host {
		display: inline-block;
	}

	.profile-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-2);
	}

	.profile-trigger__name {
		font-weight: var(--ml-font-weight-medium);
	}

	.profile-card {
		width: 260px;
	}

	.profile-card__header {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
		padding-bottom: var(--ml-space-3);
	}

	.profile-card__info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.profile-card__name {
		font-weight: var(--ml-font-weight-semibold);
		font-size: var(--ml-font-size-sm);
		color: var(--ml-color-text);
	}

	.profile-card__email {
		font-size: var(--ml-font-size-xs);
		color: var(--ml-color-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.profile-card__actions {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
		padding-top: var(--ml-space-3);
	}

	.profile-card__action {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		padding: var(--ml-space-2) var(--ml-space-2);
		border-radius: var(--ml-radius-md);
		font-size: var(--ml-font-size-sm);
		color: var(--ml-color-text);
		text-decoration: none;
		transition: background-color var(--ml-duration-150) var(--ml-ease-out);
		cursor: pointer;
	}

	.profile-card__action:hover {
		background-color: var(--ml-color-surface-raised);
	}

	.profile-card__action--danger {
		color: var(--ml-color-error);
	}

	.profile-card__action--danger:hover {
		background-color: var(--ml-color-error-subtle, rgba(239, 68, 68, 0.08));
	}
`;
