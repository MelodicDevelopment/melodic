import { css } from '@melodicdev/core';

export const toastContainerStyles = () => css`
	:host {
		display: block;
	}

	.ml-toast-container {
		position: fixed;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-3);
		padding: var(--ml-space-4);
		pointer-events: none;
	}

	.ml-toast-container ::slotted(*) {
		pointer-events: auto;
	}

	/* Top positions */
	.ml-toast-container--top-right {
		top: 0;
		right: 0;
		align-items: flex-end;
	}

	.ml-toast-container--top-left {
		top: 0;
		left: 0;
		align-items: flex-start;
	}

	.ml-toast-container--top-center {
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		align-items: center;
	}

	/* Bottom positions */
	.ml-toast-container--bottom-right {
		bottom: 0;
		right: 0;
		align-items: flex-end;
		flex-direction: column-reverse;
	}

	.ml-toast-container--bottom-left {
		bottom: 0;
		left: 0;
		align-items: flex-start;
		flex-direction: column-reverse;
	}

	.ml-toast-container--bottom-center {
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		align-items: center;
		flex-direction: column-reverse;
	}
`;
