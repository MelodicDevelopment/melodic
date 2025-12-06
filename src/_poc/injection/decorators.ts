/**
 * Decorators for the flexible injection system
 */

import { GlobalInjector } from './injector';
import type { Token, INewable, ClassBindingOptions } from './types';
import { tokenToKey } from './types';

/**
 * Options for @Injectable decorator
 */
export interface InjectableOptions extends ClassBindingOptions {
	/** Custom token (defaults to class itself) */
	token?: Token<unknown>;
}

/**
 * Mark a class as injectable and register it with the global injector
 *
 * @example
 * // Basic usage - class is its own token, singleton by default
 * @Injectable()
 * class UserService { }
 *
 * // With custom token
 * @Injectable({ token: 'IUserService' })
 * class UserServiceImpl { }
 *
 * // Non-singleton
 * @Injectable({ singleton: false })
 * class RequestScopedService { }
 */
export function Injectable(options: InjectableOptions = {}) {
	return function <T extends INewable<unknown>>(target: T): T {
		const token = options.token ?? target;

		GlobalInjector.bind(token, target, {
			singleton: options.singleton,
			dependencies: options.dependencies,
			args: options.args
		});

		return target;
	};
}

/**
 * Mark a constructor parameter for injection
 *
 * @example
 * class UserController {
 *   constructor(
 *     @Inject(UserService) private userService: UserService,
 *     @Inject('ILogger') private logger: ILogger,
 *     @Inject(CONFIG_TOKEN) private config: Config
 *   ) { }
 * }
 */
export function Inject<T>(token: Token<T>) {
	return function (target: object, _propertyKey: string | symbol | undefined, parameterIndex: number): void {
		// Get or create the params array on the class
		const ctor = target as INewable<unknown>;

		if (!ctor.hasOwnProperty('params')) {
			Object.defineProperty(ctor, 'params', {
				value: [],
				writable: true,
				enumerable: false,
				configurable: true
			});
		}

		const params = (ctor as any).params as unknown[];

		// Store the token with a marker
		params[parameterIndex] = {
			__injectionToken: tokenToKey(token)
		};
	};
}

/**
 * Property decorator for lazy injection
 *
 * @example
 * class MyComponent {
 *   @Service(UserService)
 *   private userService!: UserService;
 *
 *   @Service('ILogger')
 *   private logger!: ILogger;
 * }
 */
export function Service<T>(token: Token<T>) {
	return function (target: object, propertyKey: string | symbol): void {
		const cacheKey = Symbol(`__injected_${String(propertyKey)}`);

		Object.defineProperty(target, propertyKey, {
			get(): T {
				const self = this as Record<symbol, T>;
				if (!(cacheKey in self)) {
					self[cacheKey] = GlobalInjector.get<T>(token);
				}
				return self[cacheKey];
			},
			enumerable: true,
			configurable: true
		});
	};
}

/**
 * Create an injection token (for values/interfaces that can't be used as tokens)
 *
 * @example
 * const CONFIG_TOKEN = createToken<AppConfig>('APP_CONFIG');
 * const LOGGER_TOKEN = createToken<ILogger>('ILogger');
 *
 * // Register
 * injector.bindValue(CONFIG_TOKEN, { debug: true });
 *
 * // Inject
 * @Inject(CONFIG_TOKEN) config: AppConfig
 */
export function createToken<T>(description: string): Token<T> {
	return Symbol(description) as Token<T>;
}
