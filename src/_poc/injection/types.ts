/**
 * Flexible Injection System Types
 */

/**
 * A constructor type that can create instances of T
 */
export interface INewable<T> {
	new (...args: unknown[]): T;
}

/**
 * Token types for identifying dependencies
 *
 * - string: Named tokens like 'API_URL', 'IUserService'
 * - symbol: Unique tokens that can't collide, like Symbol('CONFIG')
 * - INewable: Class reference used as its own token
 */
export type Token<T = unknown> = string | symbol | INewable<T>;

/**
 * The type of binding registered with the injector
 */
export type BindingType = 'class' | 'value' | 'factory';

/**
 * Options for class bindings
 */
export interface ClassBindingOptions {
	/** Whether to cache the instance (default: true) */
	singleton?: boolean;
	/** Dependencies to inject (by token key) */
	dependencies?: string[];
	/** Additional constructor arguments */
	args?: unknown[];
}

/**
 * Options for factory bindings
 */
export interface FactoryBindingOptions {
	/** Whether to cache the result (default: true) */
	singleton?: boolean;
}

/**
 * Provider definitions for declarative registration
 */
export type Provider<T = unknown> =
	| INewable<T>
	| ClassProvider<T>
	| ValueProvider<T>
	| FactoryProvider<T>;

export interface ClassProvider<T> {
	provide: Token<T>;
	useClass: INewable<T>;
	singleton?: boolean;
}

export interface ValueProvider<T> {
	provide: Token<T>;
	useValue: T;
}

export interface FactoryProvider<T> {
	provide: Token<T>;
	useFactory: () => T;
	singleton?: boolean;
}

/**
 * Type guards for provider types
 */
export function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
	return typeof provider === 'object' && provider !== null && 'useClass' in provider;
}

export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
	return typeof provider === 'object' && provider !== null && 'useValue' in provider;
}

export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
	return typeof provider === 'object' && provider !== null && 'useFactory' in provider;
}

/**
 * Convert a token to a string key for internal storage
 */
export function tokenToKey<T>(token: Token<T>): string {
	if (typeof token === 'string') {
		return token;
	}
	if (typeof token === 'symbol') {
		return token.toString();
	}
	// Class - use constructor name
	return token.name;
}
