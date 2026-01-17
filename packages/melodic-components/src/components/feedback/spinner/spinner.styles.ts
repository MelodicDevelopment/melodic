import { css } from '@melodicdev/core';

export const spinnerStyles = () => css`
	:host {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.spinner__svg {
		animation: spin 1s linear infinite;
	}

	.spinner__track {
		opacity: 0.2;
	}

	.spinner__indicator {
		opacity: 1;
	}

	/* Sizes */
	.spinner--xs .spinner__svg {
		width: 0.75rem;
		height: 0.75rem;
	}

	.spinner--sm .spinner__svg {
		width: 1rem;
		height: 1rem;
	}

	.spinner--md .spinner__svg {
		width: 1.5rem;
		height: 1.5rem;
	}

	.spinner--lg .spinner__svg {
		width: 2rem;
		height: 2rem;
	}

	.spinner--xl .spinner__svg {
		width: 2.5rem;
		height: 2.5rem;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
`;
