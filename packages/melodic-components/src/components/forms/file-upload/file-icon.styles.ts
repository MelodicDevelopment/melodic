import { css } from '@melodicdev/core';

export const fileIconStyles = () => css`
	:host {
		display: inline-flex;
	}

	.ml-file-icon {
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
	}

	.ml-file-icon__svg {
		display: block;
	}

	.ml-file-icon__body {
		fill: var(--ml-color-surface);
		stroke: var(--ml-color-border);
		stroke-width: 1;
	}

	.ml-file-icon__fold {
		fill: var(--ml-color-border);
		opacity: 0.6;
	}

	.ml-file-icon__badge {
		position: absolute;
		bottom: 4px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 8px;
		font-weight: var(--ml-font-bold, 700);
		font-family: var(--ml-font-sans);
		letter-spacing: 0.02em;
		line-height: 1;
		padding: 2px 4px;
		border-radius: var(--ml-radius-xs);
		color: white;
		white-space: nowrap;
	}

	/* Sizes */
	.ml-file-icon--sm .ml-file-icon__svg {
		width: 24px;
		height: 28px;
	}

	.ml-file-icon--sm .ml-file-icon__badge {
		font-size: 6px;
		padding: 1px 3px;
		bottom: 2px;
	}

	.ml-file-icon--md .ml-file-icon__svg {
		width: 32px;
		height: 38px;
	}

	.ml-file-icon--md .ml-file-icon__badge {
		font-size: 7px;
		padding: 2px 4px;
		bottom: 3px;
	}

	.ml-file-icon--lg .ml-file-icon__svg {
		width: 40px;
		height: 48px;
	}

	.ml-file-icon--lg .ml-file-icon__badge {
		font-size: 8px;
		padding: 2px 5px;
		bottom: 4px;
	}

	.ml-file-icon--xs .ml-file-icon__svg {
		width: 20px;
		height: 24px;
	}

	.ml-file-icon--xs .ml-file-icon__badge {
		font-size: 5px;
		padding: 1px 2px;
		bottom: 2px;
	}

	.ml-file-icon--xl .ml-file-icon__svg {
		width: 48px;
		height: 58px;
	}

	.ml-file-icon--xl .ml-file-icon__badge {
		font-size: 10px;
		padding: 2px 6px;
		bottom: 6px;
	}

	/* Color variants */
	.ml-file-icon--red .ml-file-icon__badge {
		background-color: var(--ml-color-danger);
	}

	.ml-file-icon--green .ml-file-icon__badge {
		background-color: var(--ml-color-success);
	}

	.ml-file-icon--blue .ml-file-icon__badge {
		background-color: var(--ml-color-primary);
	}

	.ml-file-icon--purple .ml-file-icon__badge {
		background-color: var(--ml-purple-600, #7c3aed);
	}

	.ml-file-icon--amber .ml-file-icon__badge {
		background-color: var(--ml-color-warning);
	}

	.ml-file-icon--gray .ml-file-icon__badge {
		background-color: var(--ml-color-text-muted);
	}
`;
