import { css } from '@melodicdev/core';

export const confirmPopoverStyles = () => css`
	:host {
		display: inline-block;
	}

	.confirm-content {
		width: 260px;
	}

	.confirm-content__header {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-space-3);
	}

	.confirm-content__icon {
		color: var(--ml-color-warning);
		flex-shrink: 0;
		margin-top: 2px;
	}

	.confirm-content__message {
		font-size: var(--ml-font-size-sm);
		color: var(--ml-color-text);
		line-height: var(--ml-line-height-normal);
	}

	.confirm-content__actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--ml-space-2);
		margin-top: var(--ml-space-4);
	}
`;
