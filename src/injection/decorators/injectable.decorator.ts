import { Dependency } from '../dependency.class';
import { getTokenKey } from '../function/get-token-key.function';
import { Injector } from '../injection-engine.class';
import type { IDependency } from '../interfaces/idependency.interface';
import type { IInjectableMeta } from '../interfaces/iinjectable-meta.interface';

export function Injectable(meta: IInjectableMeta = {}): <T>(target: IDependency<T>) => IDependency<T> {
	return function <T>(target: IDependency<T>): IDependency<T> {
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
