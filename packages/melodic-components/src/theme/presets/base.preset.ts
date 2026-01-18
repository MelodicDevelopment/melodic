import { allTokens, tokensToCss } from '../tokens/all-tokens.js';

/**
 * Base theme - includes all primitive tokens
 * Applied to :root for both light and dark themes
 */
export const baseThemeCss = `:root {
	${tokensToCss(allTokens)}

	/* Default to light color scheme */
	color-scheme: light;
}`;
