/**
 * A URL is considered safe when it is http(s) or has no scheme at all
 * (relative path, query, or fragment). Anything else — javascript:, data:,
 * vbscript:, etc. — is blocked. The pattern mirrors Angular's URL
 * sanitizer: either an explicit http(s) scheme, or no colon before the
 * first `/`, `?`, or `#` (which also defeats `java\tscript:`-style
 * control-character obfuscation, since the colon is still present).
 */
const SAFE_URL_PATTERN = /^(?:https?:|[^&:/?#]*(?:[/?#]|$))/i;

/**
 * Sanitize a consumer-provided href before rendering it into an anchor.
 * Safe values pass through unchanged; unsafe values are neutralized with an
 * `unsafe:` prefix so the resulting link is inert instead of executable.
 */
export function sanitizeHref(url: string): string {
	const value = String(url ?? '');
	if (SAFE_URL_PATTERN.test(value.trim())) {
		return value;
	}
	return `unsafe:${value}`;
}
