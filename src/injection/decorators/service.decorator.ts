import { Injector } from '../classes/injection-engine.class';
import type { Token } from '../types/token.type';

export function Service<T>(token: Token<T>) {
	return function (target: any, propertyKey: string | symbol): void {
		const metadataKey = `__service_${String(propertyKey)}`;
		target[metadataKey] = token;

		Object.defineProperty(target, propertyKey, {
			get(): T {
				const cacheKey = `__cached_${String(propertyKey)}`;

				// Own-property (sentinel) check instead of truthiness: falsy
				// resolutions (false, 0, '', null) must cache too, otherwise a
				// transient/factory binding is re-resolved on every access.
				if (!Object.prototype.hasOwnProperty.call(this, cacheKey)) {
					(this as any)[cacheKey] = Injector.get<T>(token);
				}

				return (this as any)[cacheKey];
			},
			enumerable: true,
			configurable: true
		});
	};
}
