import type { INewable } from '../interfaces';
import type { Token } from './types/token.type';
import { Binding } from './binding.class';
import { getTokenKey } from './function/get-token-key.function';
import type { IClassBindingOptions } from './interfaces/iclass-binding-options.interface';
import type { IFactoryBindingOptions } from './interfaces/ifactory-binding-options.interface';

export class InjectionEngine {
	private _bindings: Map<string, Binding<unknown>> = new Map();
	private _constructionStack: Set<string> = new Set();

	/**
	 * Bind a class to the injector
	 * @overload bind(cls) - Use class as its own token
	 * @overload bind(cls, options) - Use class as token with options
	 * @overload bind(token, cls) - Use custom token with class
	 * @overload bind(token, cls, options) - Use custom token with class and options
	 */
	bind<T>(cls: INewable<T>, options?: IClassBindingOptions): Binding<T>;
	bind<T>(token: Token<T>, cls: INewable<T>, options?: IClassBindingOptions): Binding<T>;
	bind<T>(tokenOrClass: Token<T> | INewable<T>, clsOrOptions?: INewable<T> | IClassBindingOptions, maybeOptions?: IClassBindingOptions): Binding<T> {
		let token: Token<T>;
		let cls: INewable<T>;
		let options: IClassBindingOptions | undefined;

		if (typeof clsOrOptions === 'function') {
			// bind(token, cls) or bind(token, cls, options)
			token = tokenOrClass as Token<T>;
			cls = clsOrOptions as INewable<T>;
			options = maybeOptions;
		} else {
			// bind(cls) or bind(cls, options)
			token = tokenOrClass as INewable<T>;
			cls = tokenOrClass as INewable<T>;
			options = clsOrOptions as IClassBindingOptions | undefined;
		}

		const key = getTokenKey(token);
		const binding = new Binding<T>(key, token, 'class');
		binding.setClass(cls);

		if (options?.singleton !== undefined) {
			binding.setSingleton(options.singleton);
		}
		if (options?.dependencies) {
			binding.withDependencies(options.dependencies);
		}
		if (options?.args) {
			binding.withArgs(options.args);
		}

		this._bindings.set(key, binding as Binding<unknown>);
		return binding;
	}

	bindValue<T>(token: Token<T>, value: T): Binding<T> {
		const key = getTokenKey(token);
		const binding = new Binding<T>(key, token, 'value');
		binding.setInstance(value);
		binding.setSingleton(true);
		this._bindings.set(key, binding as Binding<unknown>);

		return binding;
	}

	bindFactory<T>(token: Token<T>, factory: () => T, options?: IFactoryBindingOptions): Binding<T> {
		const key = getTokenKey(token);
		const binding = new Binding<T>(key, token, 'factory');
		binding.setFactory(factory);

		if (options?.singleton !== undefined) {
			binding.setSingleton(options.singleton);
		}

		this._bindings.set(key, binding as Binding<unknown>);

		return binding;
	}

	get<T>(token: Token<T>): T {
		const key = getTokenKey(token);
		const binding = this._bindings.get(key) as Binding<T> | undefined;

		if (!binding) {
			throw new Error(`Dependency could not be found: ${key}`);
		}

		return this.resolve(binding, key);
	}

	has<T>(token: Token<T>): boolean {
		const key = getTokenKey(token);
		return this._bindings.has(key);
	}

	getBinding<T>(token: Token<T>): Binding<T> | undefined {
		const key = getTokenKey(token);
		return this._bindings.get(key) as Binding<T> | undefined;
	}

	unbind<T>(token: Token<T>): boolean {
		const key = getTokenKey(token);
		return this._bindings.delete(key);
	}

	clear(): void {
		this._bindings.clear();
	}

	private resolve<T>(binding: Binding<T>, key: string): T {
		if (binding.type === 'value') {
			return binding.getInstance()!;
		}

		const existing = binding.getInstance();
		if (existing !== undefined && binding.isSingleton) {
			return existing;
		}

		// Circular dependency detection
		if (this._constructionStack.has(key)) {
			const chain = Array.from(this._constructionStack).join(' -> ') + ` -> ${key}`;
			throw new Error(`Circular dependency detected: ${chain}`);
		}

		this._constructionStack.add(key);

		try {
			let instance: T;

			if (binding.type === 'factory') {
				instance = binding.factory!();
			} else {
				instance = this.construct(binding, key);
			}

			if (binding.isSingleton) {
				binding.setInstance(instance);
			}

			return instance;
		} finally {
			this._constructionStack.delete(key);
		}
	}

	private construct<T>(binding: Binding<T>, currentToken: string): T {
		const cls = binding.targetClass!;
		let dependencies: unknown[] = [];

		// Check for @Inject decorated parameters
		const paramTokens = (cls as any).params;

		if (paramTokens && Array.isArray(paramTokens)) {
			for (let i = 0; i < paramTokens.length; i++) {
				const param = paramTokens[i];
				if (param && typeof param === 'object' && param.__injectionToken) {
					const depKey = param.__injectionToken;
					const depBinding = this._bindings.get(depKey);

					if (!depBinding) {
						throw new Error(`Dependency '${depKey}' not found (required by '${currentToken}')`);
					}

					dependencies.push(this.resolve(depBinding as Binding<unknown>, depKey));
				} else {
					dependencies.push(undefined);
				}
			}
		} else if (binding.dependencies.length > 0) {
			// Legacy token-based dependency resolution
			for (const depKey of binding.dependencies) {
				const depBinding = this._bindings.get(depKey);

				if (!depBinding) {
					throw new Error(`Dependency '${depKey}' not found (required by '${currentToken}')`);
				}

				dependencies.push(this.resolve(depBinding as Binding<unknown>, depKey));
			}
		}

		if (binding.args.length > 0) {
			dependencies = dependencies.concat(binding.args);
		}

		return Reflect.construct(cls, dependencies);
	}
}

export const Injector = new InjectionEngine();
