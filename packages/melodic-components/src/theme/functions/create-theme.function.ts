import { allTokens } from '../tokens/all-tokens.js';

type TokenOverrides = Partial<typeof allTokens>;

/**
 * Create a custom theme by overriding default tokens
 * @param name - Theme name (used in data-theme attribute)
 * @param overrides - Token values to override
 * @returns CSS string to inject into document
 */
export function createTheme(name: string, overrides: TokenOverrides): string {
	const cssProperties = Object.entries(overrides)
		.map(([key, value]) => `${key}: ${value};`)
		.join('\n\t');

	return `[data-theme="${name}"] {\n\t${cssProperties}\n}`;
}

/**
 * Create and inject a custom theme into the document
 * @param name - Theme name
 * @param overrides - Token values to override
 * @returns Style element that was injected (can be removed to unload theme)
 */
export function injectTheme(name: string, overrides: TokenOverrides): HTMLStyleElement {
	const css = createTheme(name, overrides);
	const style = document.createElement('style');
	style.id = `ml-theme-${name}`;
	style.textContent = css;

	// Remove existing theme with same name if present
	const existing = document.getElementById(style.id);
	if (existing) {
		existing.remove();
	}

	document.head.appendChild(style);
	return style;
}

/**
 * Create a brand theme with a primary color
 * Automatically generates color variations
 */
export function createBrandTheme(
	name: string,
	options: {
		primary?: string;
		secondary?: string;
		success?: string;
		warning?: string;
		danger?: string;
	}
): string {
	const overrides: TokenOverrides = {};

	if (options.primary) {
		overrides['--ml-color-primary'] = options.primary;
	}
	if (options.secondary) {
		overrides['--ml-color-secondary'] = options.secondary;
	}
	if (options.success) {
		overrides['--ml-color-success'] = options.success;
	}
	if (options.warning) {
		overrides['--ml-color-warning'] = options.warning;
	}
	if (options.danger) {
		overrides['--ml-color-danger'] = options.danger;
	}

	return createTheme(name, overrides);
}
