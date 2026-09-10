import { Injector } from '../classes/injection-engine.class';
import type { Token } from '../types/token.type';

/**
 * Inject a bound dependency into a field, resolved lazily on first read and
 * cached per instance.
 *
 * The field is writable: assigning to it replaces the resolved value for that
 * instance only. That is what makes a component testable without a container —
 * `component.http = fakeHttp` before the first read (or after it) swaps the
 * dependency without touching the global injector.
 */
export function Service<T>(token: Token<T>) {
	return function (target: any, propertyKey: string | symbol): void {
		const metadataKey = `__service_${String(propertyKey)}`;
		target[metadataKey] = token;

		const cacheKey = `__cached_${String(propertyKey)}`;

		Object.defineProperty(target, propertyKey, {
			get(): T {
				// Own-property (sentinel) check instead of truthiness: falsy
				// resolutions (false, 0, '', null) must cache too, otherwise a
				// transient/factory binding is re-resolved on every access.
				if (!Object.prototype.hasOwnProperty.call(this, cacheKey)) {
					(this as any)[cacheKey] = Injector.get<T>(token);
				}

				return (this as any)[cacheKey];
			},
			set(value: T): void {
				Object.defineProperty(this, cacheKey, {
					value,
					writable: true,
					enumerable: false,
					configurable: true
				});
			},
			enumerable: true,
			configurable: true
		});
	};
}
