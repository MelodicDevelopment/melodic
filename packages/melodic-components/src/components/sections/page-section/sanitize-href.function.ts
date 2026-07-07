import { isSafeUrl } from '@melodicdev/core/routing';

/**
 * Sanitize a consumer-provided href before rendering it into an anchor.
 * Safe values pass through unchanged; unsafe values are neutralized with an
 * `unsafe:` prefix so the resulting link is inert instead of executable.
 *
 * Safety is decided by the core `isSafeUrl` allowlist (one sanitizer for the
 * whole framework): scheme-less URLs (relative path, query, fragment) and
 * http(s) pass; any other scheme — javascript:, data:, vbscript:, ... — is
 * blocked, including control-character obfuscations like `java\tscript:`.
 */
export function sanitizeHref(url: string): string {
	const value = String(url ?? '');
	return isSafeUrl(value) ? value : `unsafe:${value}`;
}
