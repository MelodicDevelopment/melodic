import { environment } from './environment';
import type { Environment } from './environment';

export interface ConfigDefinition<T extends Record<string, unknown>> {
	base: T;
	dev?: Partial<T>;
	qa?: Partial<T>;
	prod?: Partial<T>;
}

export function defineConfig<T extends Record<string, unknown>>(definition: ConfigDefinition<T>): T {
	const overrides = definition[environment as keyof Pick<ConfigDefinition<T>, Environment>];
	return { ...definition.base, ...overrides };
}
