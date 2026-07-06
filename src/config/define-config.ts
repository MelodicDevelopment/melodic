import { environment } from './environment';
import type { Environment } from './environment';

export interface ConfigDefinition<T extends Record<string, unknown>, TBase extends Record<string, unknown> = Record<string, unknown>> {
	extends?: TBase;
	base: T;
	dev?: Partial<T>;
	qa?: Partial<T>;
	prod?: Partial<T>;
}

/** Keys that would mutate the prototype chain when assigned via `result[key]`. */
const UNSAFE_MERGE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function deepMerge<A extends Record<string, unknown>, B extends Record<string, unknown>>(target: A, source: B): A & B {
	const result = { ...target } as Record<string, unknown>;

	for (const key of Object.keys(source)) {
		// Prototype-pollution guard: JSON.parse-derived configs can carry an own
		// '__proto__' key; assigning it would poison Object.prototype.
		if (UNSAFE_MERGE_KEYS.has(key)) {
			continue;
		}

		const targetVal = result[key];
		const sourceVal = (source as Record<string, unknown>)[key];

		if (
			sourceVal !== null &&
			typeof sourceVal === 'object' &&
			!Array.isArray(sourceVal) &&
			targetVal !== null &&
			typeof targetVal === 'object' &&
			!Array.isArray(targetVal)
		) {
			result[key] = deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
		} else {
			result[key] = sourceVal;
		}
	}

	return result as A & B;
}

export function defineConfig<T extends Record<string, unknown>, TBase extends Record<string, unknown> = Record<string, unknown>>(
	definition: ConfigDefinition<T, TBase>
): TBase & T {
	const envOverrides = definition[environment as keyof Pick<ConfigDefinition<T, TBase>, Environment>];
	// Deep-merge env overrides (same strategy as `extends`): a nested object in
	// an env block overrides only the keys it declares instead of replacing the
	// whole nested object from base.
	const resolved = envOverrides ? deepMerge(definition.base, envOverrides as Record<string, unknown>) : { ...definition.base };

	if (definition.extends) {
		return deepMerge(definition.extends, resolved);
	}

	return resolved as TBase & T;
}
