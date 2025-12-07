import type { IInjectionToken } from '../interfaces/iinjection-token.interface';

export function createToken<T>(description: string): IInjectionToken<T> {
	const symbol = Symbol(description) as unknown as IInjectionToken<T>;
	Object.defineProperty(symbol, 'description', { value: description });
	return symbol;
}
