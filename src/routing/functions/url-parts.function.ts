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
