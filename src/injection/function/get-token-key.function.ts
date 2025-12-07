import type { Token } from '../types/token.type';

export const getTokenKey = <T>(token: Token<T>): string => {
	if (typeof token === 'string') {
		return token;
	}
	if (typeof token === 'symbol') {
		return token.toString();
	}

	return (token as { name: string }).name;
};
