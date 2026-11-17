/** The three parts of a URL the router cares about. */
export interface IUrlParts {
	pathname: string;
	search: string;
	hash: string;
}

/** Split a URL into its pathname / search / hash parts. */
export function parseUrlParts(url: string): IUrlParts {
	const hashIndex = url.indexOf('#');
	const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
	const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;

	const queryIndex = withoutHash.indexOf('?');
	const search = queryIndex >= 0 ? withoutHash.slice(queryIndex) : '';
	const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;

	return { pathname, search, hash };
}

/**
 * Merge query parameters into a URL.
 *
 * The parameters are inserted **before** the fragment — appending them to the
 * whole URL would produce `/docs#intro?q=1`, where the query is part of the
 * fragment and `location.search` is empty.
 */
export function appendQueryParams(url: string, queryParams?: Record<string, string> | URLSearchParams): string {
	const params = queryParams instanceof URLSearchParams ? queryParams : new URLSearchParams(queryParams ?? {});
	const serialized = params.toString();

	if (!serialized) {
		return url;
	}

	const { pathname, search, hash } = parseUrlParts(url);
	const query = search ? `${search}&${serialized}` : `?${serialized}`;

	return `${pathname}${query}${hash}`;
}

/**
 * Give a redirect target the query string and fragment of the URL that was
 * redirected, unless the target declares its own. A route-level `redirectTo`
 * is a rename of the path; dropping `?code=…` or `#section` on the way loses
 * exactly the data a deep link or an OAuth callback carries.
 */
export function carryQueryAndHash(target: string, search: string, hash: string): string {
	const parts = parseUrlParts(target);

	return `${parts.pathname}${parts.search || search}${parts.hash || hash}`;
}

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i;

/**
 * Reduce a navigation target to a root-relative path the router can match and
 * push, or return `null` when it points at another origin.
 *
 * - `/users`, `?q=1`, `#top` and `` are returned unchanged
 * - `users/1` becomes `/users/1` (paths are matched from the root)
 * - a same-origin absolute URL is reduced to `pathname + search + hash`
 * - a cross-origin absolute (or protocol-relative) URL yields `null`
 */
export function toRootRelative(path: string): string | null {
	if (path === '' || path.startsWith('?') || path.startsWith('#')) {
		return path;
	}

	if (ABSOLUTE_URL_PATTERN.test(path) || path.startsWith('//')) {
		try {
			const url = new URL(path, window.location.href);
			if (url.origin !== window.location.origin) {
				return null;
			}
			return `${url.pathname}${url.search}${url.hash}`;
		} catch {
			return null;
		}
	}

	return path.startsWith('/') ? path : `/${path}`;
}
