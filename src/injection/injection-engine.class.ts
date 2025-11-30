import { Dependency } from './dependency.class';
import type { IDependency } from './interfaces/idependency.interface';

export class InjectionEngine {
	dependencies: Dependency<unknown>[] = [];
	#constructionStack: Set<string> = new Set(); // Track construction chain for circular dependency detection

	bind<T>(token: string, item: IDependency<T>): Dependency<T> {
		const dependency = new Dependency<T>(token, item);
		this.dependencies.push(dependency);
		return dependency;
	}

	get<T>(token: string): T {
		const dependencyRef = this.getDependency(token);

		if (dependencyRef === undefined) {
			throw new Error(`Dependency could not be found: ${token}`);
		}

		let instance = dependencyRef.getInstance();
		if (instance === undefined) {
			instance = this.construct(dependencyRef.item, dependencyRef.dependencies, dependencyRef.args, token);
			if (dependencyRef.isSingleton()) {
				dependencyRef.setInstance(instance);
			}
		}

		return instance as T;
	}

	getDependency<T>(token: string): Dependency<T> {
		return this.dependencies.find((d) => d.token === token) as Dependency<T>;
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
					if (this.#constructionStack.has(token)) {
						const chain = Array.from(this.#constructionStack).join(' -> ') + ` -> ${token}`;
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
				if (this.#constructionStack.has(token)) {
					const chain = Array.from(this.#constructionStack).join(' -> ') + ` -> ${token}`;
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
					this.#constructionStack.add(token);

					try {
						dependency = this.construct(dependencyRef.item, dependencyRef.dependencies, dependencyRef.args, token);
					} finally {
						// Always remove from stack, even if construction fails
						this.#constructionStack.delete(token);
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
