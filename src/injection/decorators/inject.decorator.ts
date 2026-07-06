import { getTokenKey } from '../function/get-token-key.function';
import type { Token } from '../types/token.type';

export function Inject<T>(token: Token<T>): (target: any, _: string | undefined, index: number) => void {
	return function (target: any, _: string | undefined, index: number): void {
		// `target.params` may be INHERITED from a decorated parent class (class
		// constructors prototype-chain to their base). Mutating the inherited
		// array would corrupt the parent's metadata for every other subclass, so
		// copy-on-write an own `params` array (seeded with the inherited tokens).
		if (!Object.getOwnPropertyDescriptor(target, 'params')) {
			target.params = Array.isArray(target.params) ? [...target.params] : [];
		}

		target.params[index] = { __injectionToken: getTokenKey(token) };
	};
}
