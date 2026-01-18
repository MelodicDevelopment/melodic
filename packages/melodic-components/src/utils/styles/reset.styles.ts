/**
 * CSS reset for component shadow DOM
 * Normalizes default browser styles
 */
export const resetStyles = `
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}

	* {
		margin: 0;
		padding: 0;
	}

	button {
		font: inherit;
		color: inherit;
		background: none;
		border: none;
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
	}

	input,
	textarea,
	select {
		font: inherit;
		color: inherit;
	}

	a {
		color: inherit;
		text-decoration: inherit;
	}

	img,
	svg {
		display: block;
		max-width: 100%;
	}

	[hidden] {
		display: none !important;
	}
`;
