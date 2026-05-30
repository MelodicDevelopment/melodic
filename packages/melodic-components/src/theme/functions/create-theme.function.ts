type TokenOverrides = Partial<Record<string, string>>;

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
	if (typeof document === 'undefined') {
		throw new Error('injectTheme requires a DOM (document is undefined).');
	}

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
 * Emit a base semantic color plus its -hover / -active / -subtle variants, so a
 * brand theme stays visually consistent (components reference the variants for
 * interaction states, not just the base).
 */
function setColorWithVariants(overrides: TokenOverrides, token: string, color: string): void {
	overrides[token] = color;
	overrides[`${token}-hover`] = `color-mix(in srgb, ${color}, black 12%)`;
	overrides[`${token}-active`] = `color-mix(in srgb, ${color}, black 22%)`;
	overrides[`${token}-subtle`] = `color-mix(in srgb, ${color}, white 88%)`;
}

/**
 * Create a brand theme from semantic colors. Each color also generates matching
 * hover/active/subtle variants so interaction states aren't left at the default
 * (e.g. a purple primary no longer hovers blue).
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
		setColorWithVariants(overrides, '--ml-color-primary', options.primary);
	}
	if (options.secondary) {
		setColorWithVariants(overrides, '--ml-color-secondary', options.secondary);
	}
	if (options.success) {
		setColorWithVariants(overrides, '--ml-color-success', options.success);
	}
	if (options.warning) {
		setColorWithVariants(overrides, '--ml-color-warning', options.warning);
	}
	if (options.danger) {
		setColorWithVariants(overrides, '--ml-color-danger', options.danger);
	}

	return createTheme(name, overrides);
}
