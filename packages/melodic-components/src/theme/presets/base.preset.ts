import { allTokens, tokensToCss } from '../tokens/all-tokens.js';
import { transitionTokens } from '../tokens/transitions.tokens.js';

/**
 * Every non-zero duration token, collapsed to 0ms. Component transitions and
 * animations all take their duration from these tokens (directly or through a
 * component token whose default is one), so redefining them is enough to
 * switch motion off library-wide for users who ask for reduced motion.
 */
const reducedMotionDurations = Object.keys(transitionTokens)
	.filter((name) => name.startsWith('--ml-duration-') && name !== '--ml-duration-0')
	.map((name) => `${name}: 0ms;`)
	.join('\n\t\t');

/**
 * Base theme - includes all primitive tokens
 * Applied to :root for both light and dark themes
 */
export const baseThemeCss = `:root {
	${tokensToCss(allTokens)}

	/* Default to light color scheme */
	color-scheme: light;
}

@media (prefers-reduced-motion: reduce) {
	:root {
		${reducedMotionDurations}
	}
}`;
