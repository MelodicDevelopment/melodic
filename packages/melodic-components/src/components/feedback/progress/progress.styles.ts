import { css } from '@melodicdev/core';

export const progressStyles = () => css`
	:host {
		display: block;
	}

	.ml-progress__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--ml-space-2);
	}

	.ml-progress__label {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
	}

	.ml-progress__value {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
	}

	.ml-progress__track {
		width: 100%;
		background-color: var(--ml-color-surface-hover);
		border-radius: var(--ml-radius-full);
		overflow: hidden;
	}

	.ml-progress--sm .ml-progress__track {
		height: 4px;
	}

	.ml-progress--md .ml-progress__track {
		height: 8px;
	}

	.ml-progress--lg .ml-progress__track {
		height: 12px;
	}

	.ml-progress__fill {
		height: 100%;
		border-radius: var(--ml-radius-full);
		transition: width var(--ml-duration-300) var(--ml-ease-out);
	}

	.ml-progress--primary .ml-progress__fill {
		background-color: var(--ml-color-primary);
	}

	.ml-progress--success .ml-progress__fill {
		background-color: var(--ml-color-success);
	}

	.ml-progress--warning .ml-progress__fill {
		background-color: var(--ml-color-warning);
	}

	.ml-progress--error .ml-progress__fill {
		background-color: var(--ml-color-error);
	}
`;
