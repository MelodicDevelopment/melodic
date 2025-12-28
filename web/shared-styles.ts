/**
 * Shared styles for Shadow DOM components
 * Import and concatenate with component-specific styles
 */

export function anchorStyles(): string {
	return `
		a {
			color: inherit;
			text-decoration: none;
			transition: color var(--alt-transition-fast), opacity var(--alt-transition-fast);
		}

		a:hover {
			text-decoration: none;
		}
	`;
}
