import type { INewable } from '../../interfaces';
import type { Token, TokenKey } from '../types/token.type';

/**
 * Returns the identity used to key a binding. Tokens are keyed by their own
 * identity — strings by value, symbols and class constructors by reference — so
 * two distinct symbol tokens created with the same description (or two classes
 * with the same name) never collide in the injector.
 */
export const getTokenKey = <T>(token: Token<T>): TokenKey => token as unknown as TokenKey;

/** Human-readable label for a token key, safe to interpolate into messages. */
export const describeToken = (key: TokenKey): string => {
	if (typeof key === 'string') {
		return key;
	}
	if (typeof key === 'symbol') {
		return key.toString();
	}

	return (key as INewable<unknown>).name || 'AnonymousToken';
};
