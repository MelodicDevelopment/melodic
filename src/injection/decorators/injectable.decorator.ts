import { Dependency } from '../dependency.class';
import { Injector } from '../injection-engine.class';
import type { IDependency } from '../interfaces/idependency.interface';
import type { IInjectableMeta } from '../interfaces/iinjectable-meta.interface';

export function Injectable(meta: IInjectableMeta): <T>(target: IDependency<T>) => IDependency<T> {
	return function <T>(target: IDependency<T>): IDependency<T> {
		const dependency: Dependency<T> = Injector.bind(meta.token, target);

		if (meta.dependencies !== undefined) {
			dependency.addDependencies(meta.dependencies);
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
