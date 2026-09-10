import type { INewable } from '../../interfaces';
import type { Token, TokenKey } from '../types/token.type';
import { Binding } from './binding.class';
import { getTokenKey, describeToken } from '../function/get-token-key.function';
import { resolveInjectedParams } from '../function/resolve-injected-params.function';
import type { IClassBindingOptions } from '../interfaces/iclass-binding-options.interface';
import type { IFactoryBindingOptions } from '../interfaces/ifactory-binding-options.interface';
import { getActiveComponent, setActiveComponent } from '../../components/functions/active-component.functions';
import { devWarn } from '../../devtools/dev-mode';

export class InjectionEngine {
	private _bindings: Map<TokenKey, Binding<unknown>> = new Map();
	private _constructionStack: Set<TokenKey> = new Set();

	/**
	 * Bind a class to the injector
	 * @overload bind(cls) - Use class as its own token
	 * @overload bind(cls, options) - Use class as token with options
	 * @overload bind(token, cls) - Use custom token with class
	 * @overload bind(token, cls, options) - Use custom token with class and options
	 */
	public bind<T>(cls: INewable<T>, options?: IClassBindingOptions): Binding<T>;
	public bind<T>(token: Token<T>, cls: INewable<T>, options?: IClassBindingOptions): Binding<T>;
	public bind<T>(tokenOrClass: Token<T> | INewable<T>, clsOrOptions?: INewable<T> | IClassBindingOptions, maybeOptions?: IClassBindingOptions): Binding<T> {
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

		this.warnOnRebind(key);
		this._bindings.set(key, binding as Binding<unknown>);
		return binding;
	}

	/**
	 * Re-binding a token whose singleton has already been handed out leaves
	 * every existing holder on the old instance while new consumers get the new
	 * one — a split-brain that is very hard to see. Warn in dev; tests that
	 * deliberately swap a binding can ignore it (or unbind first).
	 */
	private warnOnRebind(key: TokenKey): void {
		const existing = this._bindings.get(key);
		if (existing?.isSingleton && existing.getInstance() !== undefined) {
			devWarn(
				`rebind:${describeToken(key)}`,
				`'${describeToken(key)}' was re-bound after its singleton had already been resolved. ` +
					'Consumers holding the previous instance keep it, so two versions are now live. ' +
					'Bind before the first resolution, or call Injector.unbind() first.'
			);
		}
	}

	public bindValue<T>(token: Token<T>, value: T): Binding<T>;
	public bindValue<T, V>(token: Token<T>, value: V): Binding<T>;
	public bindValue<T>(token: Token<T>, value: unknown): Binding<T> {
		const key = getTokenKey(token);
		const binding = new Binding<T>(key, token, 'value');

		binding.setInstance(value as T);
		binding.setSingleton(true);

		this.warnOnRebind(key);
		this._bindings.set(key, binding as Binding<unknown>);

		return binding;
	}

	public bindFactory<T>(token: Token<T>, factory: () => T, options?: IFactoryBindingOptions): Binding<T> {
		const key = getTokenKey(token);
		const binding = new Binding<T>(key, token, 'factory');
		binding.setFactory(factory);

		if (options?.singleton !== undefined) {
			binding.setSingleton(options.singleton);
		}

		this._bindings.set(key, binding as Binding<unknown>);

		return binding;
	}

	public get<T>(token: Token<T>): T {
		const key = getTokenKey(token);
		const binding = this._bindings.get(key) as Binding<T> | undefined;

		if (!binding) {
			throw new Error(`Dependency could not be found: ${describeToken(key)}`);
		}

		return this.resolve(binding, key);
	}

	public has<T>(token: Token<T>): boolean {
		const key = getTokenKey(token);
		return this._bindings.has(key);
	}

	public getBinding<T>(token: Token<T>): Binding<T> | undefined {
		const key = getTokenKey(token);
		return this._bindings.get(key) as Binding<T> | undefined;
	}

	/**
	 * Every registered binding, as `[token key, binding]`. Powers DevTools and
	 * diagnostics; not a hook for mutating the container.
	 */
	public entries(): Array<[TokenKey, Binding<unknown>]> {
		return [...this._bindings.entries()];
	}

	public unbind<T>(token: Token<T>): boolean {
		const key = getTokenKey(token);
		return this._bindings.delete(key);
	}

	public clear(): void {
		this._bindings.clear();
	}

	private resolve<T>(binding: Binding<T>, key: TokenKey): T {
		if (binding.type === 'value') {
			return binding.getInstance()!;
		}

		const existing = binding.getInstance();
		if (existing !== undefined && binding.isSingleton) {
			return existing;
		}

		// Circular dependency detection
		if (this._constructionStack.has(key)) {
			const chain = [...this._constructionStack, key].map(describeToken).join(' -> ');
			throw new Error(`Circular dependency detected: ${chain}`);
		}

		this._constructionStack.add(key);

		// Bindings are resolved lazily — often while a component is the active
		// consumer (the one whose injection triggered this resolution). Clearing
		// the active component for the duration of construction ensures any
		// signals a service or factory creates (e.g. ComponentStateBaseService
		// selectors, a factory returning a computed) are owned by the binding,
		// not destroyed when that transient component unmounts. Applies to
		// class and factory bindings alike.
		const prevActive = getActiveComponent();
		setActiveComponent(null);

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
			setActiveComponent(prevActive);
			this._constructionStack.delete(key);
		}
	}

	private construct<T>(binding: Binding<T>, currentToken: TokenKey): T {
		const cls = binding.targetClass!;
		let dependencies: unknown[] = [];

		const resolveDependency = (depKey: TokenKey): unknown => {
			const depBinding = this._bindings.get(depKey);

			if (!depBinding) {
				throw new Error(`Dependency '${describeToken(depKey)}' not found (required by '${describeToken(currentToken)}')`);
			}

			return this.resolve(depBinding as Binding<unknown>, depKey);
		};

		// Check for @Inject decorated parameters
		const paramTokens = (cls as { params?: unknown[] }).params;

		if (Array.isArray(paramTokens) && paramTokens.length > 0) {
			dependencies = resolveInjectedParams(cls, resolveDependency);
		} else if (binding.dependencies.length > 0) {
			// Legacy token-based dependency resolution
			dependencies = binding.dependencies.map(resolveDependency);
		}

		if (binding.args.length > 0) {
			dependencies = dependencies.concat(binding.args);
		}

		// The active component is already cleared by resolve().
		return Reflect.construct(cls, dependencies);
	}
}

export const Injector = new InjectionEngine();
