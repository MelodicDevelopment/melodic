import type { IDependency } from '../interfaces';

/**
 * Parameter decorator for constructor dependency injection.
 * Stores metadata about which token to inject at which parameter position.
 *
 * Note: This decorator only stores metadata. Actual resolution happens
 * when the class is instantiated through the InjectionEngine.
 *
 * @example
 * class MyService {
 *   constructor(@Inject('Logger') private logger: Logger) {}
 * }
 */
export function Inject(token: string): (target: any, _: string | undefined, index: number) => void {
	return function <T>(target: IDependency<T>, _: string | undefined, index: number): void {
		// Store injection metadata on the class constructor
		if (!target.params) {
			target.params = [];
		}

		// Store the token to be resolved later, not the instance
		target.params[index] = { __injectionToken: token };
	};
}
