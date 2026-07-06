let nextSelectorId = 0;
const selectorKeys = new WeakMap<object, string>();

/**
 * Returns a stable, unique cache-key fragment for a selector function, keyed
 * by function identity (WeakMap). Two distinct function objects always get
 * distinct keys, even when their source text stringifies identically (e.g.
 * closures capturing different variables, or minified output).
 *
 * Consequence: a selector recreated on every call (an inline arrow in a
 * render path) never hits the cache. That is safe — render-created entries
 * are render-scoped and swept when a render stops using them (see
 * ComponentBase.trackSelectEntry) — but each render pays a computed creation.
 * Hold selectors in stable references, or pass an explicit `cacheKey`, to get
 * cache hits across renders.
 */
export function getSelectorCacheKey(selectFn: object): string {
	let key = selectorKeys.get(selectFn);

	if (key === undefined) {
		key = `fn#${++nextSelectorId}`;
		selectorKeys.set(selectFn, key);
	}

	return key;
}
