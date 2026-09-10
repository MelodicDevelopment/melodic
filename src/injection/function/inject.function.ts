import { Injector } from '../classes/injection-engine.class';
import type { Token } from '../types/token.type';

/**
 * Resolve a dependency, typed by its token.
 *
 * ```typescript
 * const http = inject(HttpClient);      // HttpClient
 * const cfg = inject(APP_CONFIG);       // the token's declared type
 * ```
 *
 * Unlike `@Service(Token) field!: T`, which happily compiles when `T` has
 * nothing to do with `Token`, the returned type comes from the token itself:
 *
 * ```typescript
 * @Service(HttpClient) private http!: Logger;  // compiles, and is wrong
 * const http: Logger = inject(HttpClient);     // type error, as it should be
 * ```
 *
 * Resolution is eager, so call it where the binding already exists — a field
 * initializer inside a component (bootstrap has run by then), `onInit`, or a
 * service constructor. `@Service` remains the lazy option.
 */
export function inject<T>(token: Token<T>): T {
	return Injector.get<T>(token);
}

/**
 * Resolve a dependency if it is bound, otherwise return `undefined` (or the
 * supplied fallback). For genuinely optional collaborators — an analytics
 * client, a logger — that an app may simply not provide.
 */
export function injectOptional<T>(token: Token<T>): T | undefined;
export function injectOptional<T>(token: Token<T>, fallback: T): T;
export function injectOptional<T>(token: Token<T>, fallback?: T): T | undefined {
	return Injector.has(token) ? Injector.get<T>(token) : fallback;
}
