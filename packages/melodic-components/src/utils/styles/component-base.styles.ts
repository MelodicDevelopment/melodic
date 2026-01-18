/**
 * Base styles shared by all ml-* components
 * Provides consistent focus states, transitions, and theming
 */
export const componentBaseStyles = `
	:host {
		/* Inherit font from parent by default */
		font-family: var(--ml-font-sans);

		/* Consistent box sizing */
		box-sizing: border-box;
	}

	:host *,
	:host *::before,
	:host *::after {
		box-sizing: inherit;
	}

	/* Focus visible styles */
	:host(:focus-visible) {
		outline: var(--ml-focus-ring-width) solid var(--ml-color-focus-ring);
		outline-offset: var(--ml-focus-ring-offset);
	}

	/* Disabled state */
	:host([disabled]) {
		opacity: 0.5;
		pointer-events: none;
	}

	/* Hidden state */
	:host([hidden]) {
		display: none !important;
	}
`;

/**
 * Focus ring mixin - apply to interactive elements
 */
export const focusRingStyles = `
	&:focus {
		outline: none;
	}

	&:focus-visible {
		outline: var(--ml-focus-ring-width) solid var(--ml-color-focus-ring);
		outline-offset: var(--ml-focus-ring-offset);
	}
`;

/**
 * Interactive element base styles
 */
export const interactiveStyles = `
	cursor: pointer;
	user-select: none;
	-webkit-tap-highlight-color: transparent;

	&:disabled,
	&[aria-disabled="true"] {
		cursor: not-allowed;
		opacity: 0.5;
	}
`;
