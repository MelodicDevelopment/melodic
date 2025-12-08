import type { IInjectionToken } from '../interfaces/iinjection-token.interface';

export function createToken<T>(description: string): IInjectionToken<T> {
	// Symbol already has a built-in description property
	return Symbol(description) as unknown as IInjectionToken<T>;
}
