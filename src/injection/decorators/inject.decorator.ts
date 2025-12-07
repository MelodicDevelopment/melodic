import { getTokenKey } from '../function/get-token-key.function';
import type { Token } from '../types/token.type';

export function Inject<T>(token: Token<T>): (target: any, _: string | undefined, index: number) => void {
	return function (target: any, _: string | undefined, index: number): void {
		if (!target.params) {
			target.params = [];
		}

		target.params[index] = { __injectionToken: getTokenKey(token) };
	};
}
