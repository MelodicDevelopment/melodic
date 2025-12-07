import type { INewable } from '../../interfaces';
import { getTokenKey } from '../function/get-token-key.function';
import { Injector } from '../injection-engine.class';
import type { IInjectableMeta } from '../interfaces/iinjectable-meta.interface';

export function Injectable<T>(meta: IInjectableMeta<T> = {}): (target: INewable<T>) => INewable<T> {
	return function (target: INewable<T>): INewable<T> {
		const token = meta.token ?? target;
		const dependencies = meta.dependencies?.map((dep) => getTokenKey(dep));

		Injector.bind(token, target, {
			singleton: meta.singleton,
			dependencies,
			args: meta.args
		});

		return target;
	};
}
