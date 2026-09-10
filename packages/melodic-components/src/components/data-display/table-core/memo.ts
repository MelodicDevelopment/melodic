/**
 * A tiny dependency-keyed memo for derived row sets.
 *
 * `displayRows()` is called by `VirtualScroller.itemCount` on every scroll
 * event and four to six times per render, and each call cloned, filtered and
 * sorted the whole dataset. Memoizing on the identity of the inputs makes the
 * repeat calls free while still recomputing the moment anything real changes.
 */
export function memoOn<T>(): (deps: readonly unknown[], compute: () => T) => T {
	let lastDeps: readonly unknown[] | null = null;
	let lastValue: T;

	return (deps, compute) => {
		if (lastDeps !== null && lastDeps.length === deps.length && lastDeps.every((dep, i) => Object.is(dep, deps[i]))) {
			return lastValue;
		}

		lastDeps = deps;
		lastValue = compute();
		return lastValue;
	};
}
