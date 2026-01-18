import { colorTokens, primitiveColors } from './colors.tokens.js';
import { spacingTokens } from './spacing.tokens.js';
import { typographyTokens } from './typography.tokens.js';
import { shadowTokens } from './shadows.tokens.js';
import { borderTokens } from './borders.tokens.js';
import { transitionTokens } from './transitions.tokens.js';
import { breakpointTokens } from './breakpoints.tokens.js';

/**
 * All design tokens combined
 */
export const allTokens = {
	...primitiveColors,
	...colorTokens,
	...spacingTokens,
	...typographyTokens,
	...shadowTokens,
	...borderTokens,
	...transitionTokens,
	...breakpointTokens
} as const;

/**
 * Convert tokens object to CSS custom properties string
 */
export function tokensToCss(tokens: Record<string, string>): string {
	return Object.entries(tokens)
		.map(([key, value]) => `${key}: ${value};`)
		.join('\n\t');
}

/**
 * Generate a complete CSS string with all tokens
 */
export function generateTokensCss(): string {
	return `:root {\n\t${tokensToCss(allTokens)}\n}`;
}
