import type { Token } from '../types/token.type';

export const getTokenKey = <T>(token: Token<T>): string => {
	if (typeof token === 'string') {
		return token;
	}
	return token.name || token.toString();
};
