/**
 * Visually hidden styles - hides content visually but keeps it accessible to screen readers
 */
export const visuallyHiddenStyles = `
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

	.visually-hidden:focus,
	.visually-hidden:active {
		position: static;
		width: auto;
		height: auto;
		margin: 0;
		overflow: visible;
		clip: auto;
		white-space: normal;
	}
`;

/**
 * CSS string for visually hidden content (inline use)
 */
export const visuallyHiddenCss = `
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
`;
