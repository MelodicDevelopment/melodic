import type { TokenKey } from '../types/token.type';

interface InjectedParam {
	__injectionToken: TokenKey;
}

/**
 * Resolve the constructor dependencies declared via `@Inject` on a class.
 *
 * `params` is a sparse, position-indexed array set by the `@Inject` decorator.
 * This iterates by index (positions without an `@Inject` resolve to `undefined`)
 * and defers the actual lookup to the supplied `resolve` callback, so both the
 * injector engine and the component decorator share one iteration implementation
 * while keeping their own resolution/error semantics.
 */
export function resolveInjectedParams(target: unknown, resolve: (token: TokenKey) => unknown): unknown[] {
	const paramTokens = (target as { params?: unknown[] } | null)?.params;
	const dependencies: unknown[] = [];

	if (!Array.isArray(paramTokens)) {
		return dependencies;
	}

	for (let i = 0; i < paramTokens.length; i++) {
		const param = paramTokens[i] as InjectedParam | undefined;
		if (param && typeof param === 'object' && param.__injectionToken !== undefined) {
			dependencies.push(resolve(param.__injectionToken));
		} else {
			dependencies.push(undefined);
		}
	}

	return dependencies;
}
