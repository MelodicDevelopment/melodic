import { Dependency } from '../dependency.class';
import { Injector } from '../injection-engine.class';
import type { IDependency } from '../interfaces/idependency.interface';
import type { IInjectableMeta } from '../interfaces/iinjectable-meta.interface';
import type { Token } from '../injection-engine.class';

/**
 * Convert token to string key for storage
 */
function getTokenKey<T>(token: Token<T>): string {
	if (typeof token === 'string') {
		return token;
	}
	return token.name || token.toString();
}

export function Injectable(meta: IInjectableMeta = {}): <T>(target: IDependency<T>) => IDependency<T> {
	return function <T>(target: IDependency<T>): IDependency<T> {
		// Default token to the class itself if not provided
		const token = meta.token ?? target;
		const dependency: Dependency<T> = Injector.bind(token, target);

		if (meta.dependencies !== undefined) {
			// Convert Token[] to string[] for storage
			const dependencyKeys = meta.dependencies.map((dep) => getTokenKey(dep));
			dependency.addDependencies(dependencyKeys);
		}

		if (meta.args !== undefined) {
			dependency.addArgs(meta.args);
		}

		if (meta.singleton !== undefined) {
			dependency.setSingleton(meta.singleton);
		}

		return target;
	};
}
