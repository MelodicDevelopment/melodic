import { Injector } from '../injection-engine.class';
import type { Token } from '../injection-engine.class';

/**
 * Property decorator for service injection.
 * Automatically resolves and injects the service from the DI container.
 *
 * @example
 * // Using class-based token (recommended)
 * class MyComponent {
 *   @Service(TodoService) private todoService!: TodoService;
 * }
 *
 * @example
 * // Using string token
 * class MyComponent {
 *   @Service('TodoService') private todoService!: TodoService;
 * }
 */
export function Service<T>(token: Token<T>) {
	return function (target: any, propertyKey: string | symbol): void {
		// Store the token in metadata
		const metadataKey = `__service_${String(propertyKey)}`;
		target[metadataKey] = token;

		// Define a getter that lazily resolves the service
		Object.defineProperty(target, propertyKey, {
			get(): T {
				// Cache the instance on the component instance
				const cacheKey = `__cached_${String(propertyKey)}`;
				if (!(this as any)[cacheKey]) {
					(this as any)[cacheKey] = Injector.get<T>(token);
				}
				return (this as any)[cacheKey];
			},
			enumerable: true,
			configurable: true
		});
	};
}
