type TokenOverrides = Partial<Record<string, string>>;

/** Theme names end up inside a CSS attribute selector — keep them boring. */
const THEME_NAME_PATTERN = /^[a-z0-9-]+$/;

/** Override keys must be CSS custom properties (design tokens). */
const TOKEN_NAME_PATTERN = /^--[a-zA-Z0-9_-]+$/;

/**
 * Characters that would let a value break out of its declaration and inject
 * arbitrary CSS rules (`;`, `{`, `}`) or markup when the returned CSS string
 * is embedded in a page (`<`, `>`), plus control characters.
 */
// eslint-disable-next-line no-control-regex
const UNSAFE_VALUE_PATTERN = /[;{}<>\u0000-\u001f\u007f]/;

function assertValidThemeName(name: string): void {
	if (!THEME_NAME_PATTERN.test(name)) {
		throw new Error(
			`[melodic] Invalid theme name "${name}". Theme names may only contain lowercase letters, digits, and hyphens (matching ${THEME_NAME_PATTERN}).`
		);
	}
}

function assertValidOverride(key: string, value: string): void {
	if (!TOKEN_NAME_PATTERN.test(key)) {
		throw new Error(
			`[melodic] Invalid theme token "${key}". Token names must be CSS custom properties (e.g. "--ml-color-primary") matching ${TOKEN_NAME_PATTERN}.`
		);
	}

	if (UNSAFE_VALUE_PATTERN.test(value)) {
		throw new Error(
			`[melodic] Invalid value for theme token "${key}". Values must not contain ";", "{", "}", "<", ">", or control characters.`
		);
	}
}

/**
 * Create a custom theme by overriding default tokens.
 *
 * The theme name and every override are validated before being interpolated
 * into CSS: names must match `^[a-z0-9-]+$`, keys must be CSS custom
 * properties, and values must not contain characters that could break out of
 * the declaration block. Invalid input throws.
 *
 * @param name - Theme name (used in data-theme attribute)
 * @param overrides - Token values to override
 * @returns CSS string to inject into document
 */
export function createTheme(name: string, overrides: TokenOverrides): string {
	assertValidThemeName(name);

	const cssProperties = Object.entries(overrides)
		.map(([key, value]) => {
			const stringValue = String(value ?? '');
			assertValidOverride(key, stringValue);
			return `${key}: ${stringValue};`;
		})
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

/** Color mode a brand theme is generated for. */
export type BrandThemeMode = 'light' | 'dark';

/**
 * Emit a base semantic color plus its -hover / -active / -subtle variants, so a
 * brand theme stays visually consistent (components reference the variants for
 * interaction states, not just the base).
 *
 * In light mode, hover/active darken the base and -subtle is a near-white
 * tint. In dark mode, hover/active lighten the base and -subtle is a
 * near-black tint, so subtle backgrounds sit correctly on dark surfaces.
 */
function setColorWithVariants(overrides: TokenOverrides, token: string, color: string, mode: BrandThemeMode): void {
	const interactionMix = mode === 'dark' ? 'white' : 'black';
	const subtleMix = mode === 'dark' ? 'black' : 'white';

	overrides[token] = color;
	overrides[`${token}-hover`] = `color-mix(in srgb, ${color}, ${interactionMix} 12%)`;
	overrides[`${token}-active`] = `color-mix(in srgb, ${color}, ${interactionMix} 22%)`;
	overrides[`${token}-subtle`] = `color-mix(in srgb, ${color}, ${subtleMix} 88%)`;
}

/**
 * Create a brand theme from semantic colors. Each color also generates matching
 * hover/active/subtle variants so interaction states aren't left at the default
 * (e.g. a purple primary no longer hovers blue).
 *
 * Pass `mode: 'dark'` to generate variants suited to dark surfaces
 * (hover/active lighten instead of darken; -subtle mixes toward black instead
 * of white). Defaults to `'light'` for backwards compatibility.
 */
export function createBrandTheme(
	name: string,
	options: {
		primary?: string;
		secondary?: string;
		success?: string;
		warning?: string;
		danger?: string;
		/** Color mode the variants are generated for (default: 'light') */
		mode?: BrandThemeMode;
	}
): string {
	const overrides: TokenOverrides = {};
	const mode: BrandThemeMode = options.mode ?? 'light';

	if (options.primary) {
		setColorWithVariants(overrides, '--ml-color-primary', options.primary, mode);
	}
	if (options.secondary) {
		setColorWithVariants(overrides, '--ml-color-secondary', options.secondary, mode);
	}
	if (options.success) {
		setColorWithVariants(overrides, '--ml-color-success', options.success, mode);
	}
	if (options.warning) {
		setColorWithVariants(overrides, '--ml-color-warning', options.warning, mode);
	}
	if (options.danger) {
		setColorWithVariants(overrides, '--ml-color-danger', options.danger, mode);
	}

	return createTheme(name, overrides);
}
