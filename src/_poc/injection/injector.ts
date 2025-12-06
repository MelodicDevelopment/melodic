/**
 * Injector - Flexible Dependency Injection Container
 *
 * Supports multiple binding types:
 * - bind(token, class) - Class instantiation
 * - bindValue(token, value) - Literal values
 * - bindFactory(token, fn) - Factory functions
 *
 * Supports multiple token types:
 * - string: 'API_URL', 'IUserService'
 * - symbol: Symbol('CONFIG')
 * - class: UserService (class reference)
 */

import { Binding } from './binding';
import type {
	Token,
	INewable,
	ClassBindingOptions,
	FactoryBindingOptions,
	Provider
} from './types';
import { tokenToKey, isClassProvider, isValueProvider, isFactoryProvider } from './types';

export class Injector {
	private _bindings = new Map<string, Binding<unknown>>();
	private _constructionStack = new Set<string>(); // Circular dependency detection

	/**
	 * Bind a class to a token
	 *
	 * @example
	 * // Class as its own token
	 * injector.bind(UserService);
	 *
	 * // String token with class implementation
	 * injector.bind('IUserService', UserService);
	 *
	 * // With options
	 * injector.bind(UserService, { singleton: false });
	 * injector.bind('ILogger', ConsoleLogger, { singleton: true });
	 */
	bind<T>(cls: INewable<T>, options?: ClassBindingOptions): Binding<T>;
	bind<T>(token: Token<T>, cls: INewable<T>, options?: ClassBindingOptions): Binding<T>;
	bind<T>(
		tokenOrClass: Token<T> | INewable<T>,
		clsOrOptions?: INewable<T> | ClassBindingOptions,
		maybeOptions?: ClassBindingOptions
	): Binding<T> {
		let token: Token<T>;
		let cls: INewable<T>;
		let options: ClassBindingOptions | undefined;

		// Parse overloaded arguments
		if (typeof clsOrOptions === 'function') {
			// bind(token, class, options?)
			token = tokenOrClass;
			cls = clsOrOptions as INewable<T>;
			options = maybeOptions;
		} else {
			// bind(class, options?)
			token = tokenOrClass as INewable<T>;
			cls = tokenOrClass as INewable<T>;
			options = clsOrOptions as ClassBindingOptions | undefined;
		}

		const binding = Binding.forClass(token, cls);

		if (options?.singleton !== undefined) {
			binding.setSingleton(options.singleton);
		}
		if (options?.dependencies) {
			binding.withDependencies(options.dependencies);
		}
		if (options?.args) {
			binding.withArgs(options.args);
		}

		this._bindings.set(binding.key, binding as Binding<unknown>);
		return binding;
	}

	/**
	 * Bind a literal value to a token
	 *
	 * @example
	 * injector.bindValue('API_URL', 'https://api.example.com');
	 * injector.bindValue('CONFIG', { debug: true, version: '1.0' });
	 * injector.bindValue(HttpClient, httpClientInstance);
	 */
	bindValue<T>(token: Token<T>, value: T): Binding<T> {
		const binding = Binding.forValue(token, value);
		this._bindings.set(binding.key, binding as Binding<unknown>);
		return binding;
	}

	/**
	 * Bind a factory function to a token
	 *
	 * @example
	 * // Singleton factory (default)
	 * injector.bindFactory(DbConnection, () => new DbConnection(config));
	 *
	 * // Non-singleton - new instance each time
	 * injector.bindFactory('RequestId', () => crypto.randomUUID(), { singleton: false });
	 */
	bindFactory<T>(token: Token<T>, factory: () => T, options?: FactoryBindingOptions): Binding<T> {
		const binding = Binding.forFactory(token, factory);

		if (options?.singleton !== undefined) {
			binding.setSingleton(options.singleton);
		}

		this._bindings.set(binding.key, binding as Binding<unknown>);
		return binding;
	}

	/**
	 * Register a provider (declarative syntax)
	 *
	 * @example
	 * injector.register(UserService);
	 * injector.register({ provide: 'API_URL', useValue: 'https://api.example.com' });
	 * injector.register({ provide: DbConnection, useFactory: () => new DbConnection() });
	 */
	register<T>(provider: Provider<T>): Binding<T> {
		if (typeof provider === 'function') {
			// Class provider shorthand
			return this.bind(provider);
		}

		if (isValueProvider(provider)) {
			return this.bindValue(provider.provide, provider.useValue);
		}

		if (isFactoryProvider(provider)) {
			return this.bindFactory(provider.provide, provider.useFactory, {
				singleton: provider.singleton
			});
		}

		if (isClassProvider(provider)) {
			return this.bind(provider.provide, provider.useClass, {
				singleton: provider.singleton
			});
		}

		throw new Error('[Injector] Invalid provider configuration');
	}

	/**
	 * Get a dependency by token
	 *
	 * @example
	 * const userService = injector.get(UserService);
	 * const apiUrl = injector.get<string>('API_URL');
	 * const config = injector.get<AppConfig>(CONFIG_TOKEN);
	 */
	get<T>(token: Token<T>): T {
		const key = tokenToKey(token);
		const binding = this._bindings.get(key) as Binding<T> | undefined;

		if (!binding) {
			throw new Error(`[Injector] No binding found for: ${key}`);
		}

		return this.resolve(binding);
	}

	/**
	 * Check if a token is registered
	 */
	has<T>(token: Token<T>): boolean {
		return this._bindings.has(tokenToKey(token));
	}

	/**
	 * Get a binding without resolving it
	 */
	getBinding<T>(token: Token<T>): Binding<T> | undefined {
		return this._bindings.get(tokenToKey(token)) as Binding<T> | undefined;
	}

	/**
	 * Remove a binding
	 */
	unbind<T>(token: Token<T>): boolean {
		return this._bindings.delete(tokenToKey(token));
	}

	/**
	 * Clear all bindings
	 */
	clear(): void {
		this._bindings.clear();
	}

	/**
	 * Resolve a binding to its value
	 */
	private resolve<T>(binding: Binding<T>): T {
		// Already resolved singleton
		if (binding.isSingleton && binding.isResolved) {
			return binding.getInstance()!;
		}

		let instance: T;

		switch (binding.type) {
			case 'value':
				// Values are always pre-resolved
				instance = binding.getInstance()!;
				break;

			case 'factory':
				instance = this.resolveFactory(binding);
				break;

			case 'class':
				instance = this.resolveClass(binding);
				break;

			default:
				throw new Error(`[Injector] Unknown binding type: ${binding.type}`);
		}

		// Cache singleton
		if (binding.isSingleton) {
			binding.setInstance(instance);
		}

		return instance;
	}

	/**
	 * Resolve a factory binding
	 */
	private resolveFactory<T>(binding: Binding<T>): T {
		const factory = binding.factory;
		if (!factory) {
			throw new Error(`[Injector] Factory binding has no factory function: ${binding.key}`);
		}
		return factory();
	}

	/**
	 * Resolve a class binding
	 */
	private resolveClass<T>(binding: Binding<T>): T {
		const cls = binding.classRef;
		if (!cls) {
			throw new Error(`[Injector] Class binding has no class reference: ${binding.key}`);
		}

		// Circular dependency detection
		if (this._constructionStack.has(binding.key)) {
			const chain = [...this._constructionStack, binding.key].join(' -> ');
			throw new Error(`[Injector] Circular dependency detected: ${chain}`);
		}

		this._constructionStack.add(binding.key);

		try {
			// Resolve dependencies
			const deps = this.resolveDependencies(binding, cls);

			// Add extra args
			const args = [...deps, ...binding.args];

			// Construct
			return Reflect.construct(cls, args);
		} finally {
			this._constructionStack.delete(binding.key);
		}
	}

	/**
	 * Resolve dependencies for a class binding
	 */
	private resolveDependencies<T>(binding: Binding<T>, cls: INewable<T>): unknown[] {
		const deps: unknown[] = [];

		// Check for @Inject decorator metadata
		const paramTokens = (cls as any).params;
		if (paramTokens && Array.isArray(paramTokens)) {
			for (const param of paramTokens) {
				if (param && typeof param === 'object' && param.__injectionToken) {
					deps.push(this.get(param.__injectionToken));
				} else {
					deps.push(undefined);
				}
			}
			return deps;
		}

		// Fall back to explicit dependencies
		for (const depKey of binding.dependencies) {
			deps.push(this.get(depKey));
		}

		return deps;
	}
}

/**
 * Global injector instance
 */
export const GlobalInjector = new Injector();
