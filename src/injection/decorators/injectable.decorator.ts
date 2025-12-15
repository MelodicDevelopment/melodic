import type { INewable } from '../../interfaces';
import { getTokenKey } from '../function/get-token-key.function';
import { Injector } from '../';
import type { IInjectableMeta } from '../interfaces/iinjectable-meta.interface';

export function Injectable<T>(meta: IInjectableMeta<T> = {}): (target: INewable<T>) => void {
	return function (target: INewable<T>): void {
		const token = meta.token ?? target;
		const dependencies = meta.dependencies?.map((dep) => getTokenKey(dep));

		Injector.bind(token, target, {
			singleton: meta.singleton,
			dependencies,
			args: meta.args
		});
	};
}
