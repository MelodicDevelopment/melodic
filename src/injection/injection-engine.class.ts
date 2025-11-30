import { Dependency } from './dependency.class';
import type { IDependency } from './interfaces/idependency.interface';

// Union type for tokens - supports both strings and classes
export type Token<T = any> = string | IDependency<T>;

export class InjectionEngine {
	private _dependencies: Dependency<unknown>[] = [];
	private _constructionStack: Set<string> = new Set(); // Track construction chain for circular dependency detection

	bind<T>(token: Token<T>, item: IDependency<T>): Dependency<T> {
		const tokenKey = this.getTokenKey(token);
		const dependency = new Dependency<T>(tokenKey, item);
		this._dependencies.push(dependency);
		return dependency;
	}

	get<T>(token: Token<T>): T {
		const tokenKey = this.getTokenKey(token);
		const dependencyRef = this.getDependency<T>(tokenKey);

		if (dependencyRef === undefined) {
			throw new Error(`Dependency could not be found: ${tokenKey}`);
		}

		let instance = dependencyRef.getInstance();
		if (instance === undefined) {
			instance = this.construct(dependencyRef.item, dependencyRef.dependencies, dependencyRef.args, tokenKey);
			if (dependencyRef.isSingleton()) {
				dependencyRef.setInstance(instance);
			}
		}

		return instance as T;
	}

	getDependency<T>(tokenKey: string): Dependency<T> {
		return this._dependencies.find((d) => d.token === tokenKey) as Dependency<T>;
	}

	/**
	 * Convert token to string key for storage
	 * Supports both string tokens and class constructors
	 */
	private getTokenKey<T>(token: Token<T>): string {
		if (typeof token === 'string') {
			return token;
		}
		// Use class name for class-based tokens
		return token.name || token.toString();
	}

	construct<T>(dependent: IDependency<T>, tokens: string[] = [], args: unknown[] = [], currentToken?: string): T {
		let dependencies: unknown[] = [];

		// Check if class has @Inject parameter decorators
		const paramTokens = (dependent as any).params;
		if (paramTokens && Array.isArray(paramTokens)) {
			// Resolve dependencies from @Inject decorators
			for (let i = 0; i < paramTokens.length; i++) {
				const param = paramTokens[i];
				if (param && typeof param === 'object' && param.__injectionToken) {
					const token = param.__injectionToken;

					// Circular dependency detection
					if (this._constructionStack.has(token)) {
						const chain = Array.from(this._constructionStack).join(' -> ') + ` -> ${token}`;
						throw new Error(`Circular dependency detected: ${chain}`);
					}

					const dependencyRef = this.getDependency(token);
					if (!dependencyRef) {
						throw new Error(`Dependency '${token}' not found (required by '${currentToken || 'unknown'}')`);
					}

					dependencies.push(this.get(token));
				} else {
					// No injection metadata for this parameter
					dependencies.push(undefined);
				}
			}
		} else if (tokens.length > 0) {
			// Use legacy token-based dependency resolution
			tokens.forEach((token) => {
				// Circular dependency detection
				if (this._constructionStack.has(token)) {
					const chain = Array.from(this._constructionStack).join(' -> ') + ` -> ${token}`;
					throw new Error(`Circular dependency detected: ${chain}`);
				}

				const dependencyRef: Dependency<T> = this.getDependency(token);

				if (!dependencyRef) {
					throw new Error(`Dependency '${token}' not found (required by '${currentToken || 'unknown'}')`);
				}

				let dependency = dependencyRef.getInstance();

				// Fixed: Check undefined instead of null for consistency
				if ((dependencyRef.isSingleton() && dependency === undefined) || !dependencyRef.isSingleton()) {
					// Add to construction stack
					this._constructionStack.add(token);

					try {
						dependency = this.construct(dependencyRef.item, dependencyRef.dependencies, dependencyRef.args, token);
					} finally {
						// Always remove from stack, even if construction fails
						this._constructionStack.delete(token);
					}
				}

				// Fixed: Check undefined instead of null
				if (dependencyRef.isSingleton() && dependencyRef.getInstance() === undefined) {
					dependencyRef.setInstance(dependency);
				}

				dependencies.push(dependency);
			});
		}

		if (args.length > 0) {
			dependencies = dependencies.concat(args);
		}

		return Reflect.construct(dependent, dependencies);
	}
}

export const Injector = new InjectionEngine();
