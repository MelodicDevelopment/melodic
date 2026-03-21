import { css } from '@melodicdev/core';

export const toggleStyles = () => css`
	:host {
		display: block;

		/* --- Track --- */
		--ml-toggle-track-width: 2.75rem;
		--ml-toggle-track-height: 1.5rem;
		--ml-toggle-track-bg: var(--ml-color-toggle-off);
		--ml-toggle-track-hover-bg: var(--ml-color-toggle-off-hover);
		--ml-toggle-track-checked-bg: var(--ml-color-primary);
		--ml-toggle-track-checked-hover-bg: var(--ml-color-primary-hover);
		--ml-toggle-track-border-radius: var(--ml-radius-full);

		/* --- Thumb --- */
		--ml-toggle-thumb-size: 1.25rem;
		--ml-toggle-thumb-bg: var(--ml-white);
		--ml-toggle-thumb-border-radius: var(--ml-radius-full);
		--ml-toggle-thumb-shadow: var(--ml-shadow-sm);
		--ml-toggle-thumb-offset: 0.125rem;
		--ml-toggle-thumb-translate: 1.25rem;

		/* --- Focus --- */
		--ml-toggle-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Label --- */
		--ml-toggle-label-font-size: var(--ml-text-sm);
		--ml-toggle-label-font-weight: var(--ml-font-medium);
		--ml-toggle-label-color: var(--ml-color-text-secondary);

		/* --- Hint --- */
		--ml-toggle-hint-font-size: var(--ml-text-sm);
		--ml-toggle-hint-color: var(--ml-color-text-muted);

		/* --- Gap --- */
		--ml-toggle-gap: var(--ml-space-3);

		/* --- Disabled --- */
		--ml-toggle-disabled-opacity: 0.5;

		/* --- Transition --- */
		--ml-toggle-transition-duration: var(--ml-duration-200);
		--ml-toggle-transition-easing: var(--ml-ease-in-out);
	}

	.ml-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-toggle-gap);
		cursor: pointer;
		user-select: none;
	}

	.ml-toggle--disabled {
		cursor: not-allowed;
		pointer-events: none;
	}

	.ml-toggle--disabled .ml-toggle__track,
	.ml-toggle--disabled .ml-toggle__label {
		opacity: var(--ml-toggle-disabled-opacity);
	}

	.ml-toggle__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ml-toggle__track {
		position: relative;
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		width: var(--ml-toggle-track-width);
		height: var(--ml-toggle-track-height);
		background-color: var(--ml-toggle-track-bg);
		border-radius: var(--ml-toggle-track-border-radius);
		transition:
			background-color var(--ml-toggle-transition-duration) var(--ml-toggle-transition-easing),
			box-shadow var(--ml-toggle-transition-duration) var(--ml-toggle-transition-easing);
	}

	.ml-toggle__input:focus-visible + .ml-toggle__track {
		box-shadow: var(--ml-toggle-focus-shadow);
	}

	.ml-toggle--checked .ml-toggle__track {
		background-color: var(--ml-toggle-track-checked-bg);
	}

	.ml-toggle:hover:not(.ml-toggle--disabled) .ml-toggle__track {
		background-color: var(--ml-toggle-track-hover-bg);
	}

	.ml-toggle--checked:hover:not(.ml-toggle--disabled) .ml-toggle__track {
		background-color: var(--ml-toggle-track-checked-hover-bg);
	}

	.ml-toggle__thumb {
		position: absolute;
		width: var(--ml-toggle-thumb-size);
		height: var(--ml-toggle-thumb-size);
		left: var(--ml-toggle-thumb-offset);
		background-color: var(--ml-toggle-thumb-bg);
		border-radius: var(--ml-toggle-thumb-border-radius);
		box-shadow: var(--ml-toggle-thumb-shadow);
		transition: transform var(--ml-toggle-transition-duration) var(--ml-toggle-transition-easing);
	}

	/* --- Size variants --- */
	.ml-toggle--sm {
		--ml-toggle-track-width: 2.25rem;
		--ml-toggle-track-height: 1.25rem;
		--ml-toggle-thumb-size: 1rem;
		--ml-toggle-thumb-translate: 1rem;
	}

	.ml-toggle--sm.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate));
	}

	.ml-toggle--md {
		--ml-toggle-track-width: 2.75rem;
		--ml-toggle-track-height: 1.5rem;
		--ml-toggle-thumb-size: 1.25rem;
		--ml-toggle-thumb-translate: 1.25rem;
	}

	.ml-toggle--md.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate));
	}

	.ml-toggle--lg {
		--ml-toggle-track-width: 3rem;
		--ml-toggle-track-height: 1.75rem;
		--ml-toggle-thumb-size: 1.5rem;
		--ml-toggle-thumb-translate: 1.25rem;
		--ml-toggle-label-font-size: var(--ml-text-base);
	}

	.ml-toggle--lg.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate));
	}

	.ml-toggle__label {
		font-size: var(--ml-toggle-label-font-size);
		font-weight: var(--ml-toggle-label-font-weight);
		color: var(--ml-toggle-label-color);
	}

	.ml-toggle__hint {
		display: block;
		margin-top: var(--ml-space-1);
		margin-left: calc(var(--ml-toggle-track-width) + var(--ml-toggle-gap));
		font-size: var(--ml-toggle-hint-font-size);
		color: var(--ml-toggle-hint-color);
		line-height: var(--ml-leading-tight);
	}
`;
