import { css } from '@melodicdev/core';

export const spinnerStyles = () => css`
	:host {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		/* Color — defaults to currentColor via stroke in SVG */
		--ml-spinner-color: currentColor;

		/* Size — default md (1.5rem) */
		--ml-spinner-size: 1.5rem;

		/* Track opacity */
		--ml-spinner-track-opacity: 0.25;

		/* Animation */
		--ml-spinner-animation-duration: 0.75s;
	}

	.spinner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.spinner__svg {
		animation: spin var(--ml-spinner-animation-duration) linear infinite;
	}

	.spinner__track {
		opacity: var(--ml-spinner-track-opacity);
	}

	.spinner__indicator {
		opacity: 1;
	}

	.spinner--xs {
		--ml-spinner-size: 1rem;
	}

	.spinner--sm {
		--ml-spinner-size: 1.25rem;
	}

	.spinner--md {
		--ml-spinner-size: 1.5rem;
	}

	.spinner--lg {
		--ml-spinner-size: 2rem;
	}

	.spinner--xl {
		--ml-spinner-size: 2.5rem;
	}

	.spinner--xs .spinner__svg,
	.spinner--sm .spinner__svg,
	.spinner--md .spinner__svg,
	.spinner--lg .spinner__svg,
	.spinner--xl .spinner__svg {
		width: var(--ml-spinner-size);
		height: var(--ml-spinner-size);
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
