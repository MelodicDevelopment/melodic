/**
 * Pick the entry whose `href` best matches `path`.
 *
 * A plain `startsWith` + first match let a shorter href shadow a longer one:
 * with `/admin` declared before `/admin/users`, every page under `/admin`
 * highlighted the `/admin` tab. Matching is therefore:
 *
 * 1. an exact path match, else
 * 2. the LONGEST href that is a path-segment prefix of `path` — `/admin` matches
 *    `/admin/users` but not `/administration`.
 */
export function matchTabByRoute<T extends { href?: string; value: string }>(entries: T[], path: string): T | undefined {
	const normalized = normalize(path);

	let best: T | undefined;
	let bestLength = -1;

	for (const entry of entries) {
		if (!entry.href) {
			continue;
		}

		const href = normalize(entry.href.split(/[?#]/)[0]);

		if (href === normalized) {
			return entry;
		}

		if (normalized.startsWith(`${href === '/' ? '' : href}/`) && href.length > bestLength) {
			best = entry;
			bestLength = href.length;
		}
	}

	return best;
}

function normalize(path: string): string {
	const withSlash = path.startsWith('/') ? path : `/${path}`;
	return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
}
