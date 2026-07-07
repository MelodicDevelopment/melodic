const SAFE_SCHEMES = new Set(['http', 'https']);

/**
 * Protocol allowlist for router links: relative/hash/query URLs and
 * http(s) absolute URLs are safe; any other scheme (`javascript:`, `data:`,
 * `vbscript:`, ...) is rejected so a data-driven link value can never become
 * script execution via `href` or `window.open`.
 */
export function isSafeUrl(url: string): boolean {
	if (!url) {
		return true;
	}

	// URL parsers strip tab/newline/CR anywhere and C0 controls/spaces at the
	// edges, so normalize the same way before scheme detection — otherwise
	// "java\tscript:" would slip past as scheme-less.
	const normalized = url.replace(/[\t\n\r]/g, '').replace(/^[\u0000-\u0020]+/, '');

	const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(normalized);
	if (!schemeMatch) {
		// Relative path, query, or hash — resolved against the current origin.
		return true;
	}

	return SAFE_SCHEMES.has(schemeMatch[1].toLowerCase());
}
