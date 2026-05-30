import type { IDirectiveResult } from '../interfaces/idirective-result.interface';

export function isDirective(value: unknown): value is IDirectiveResult {
	return (
		typeof value === 'object' &&
		value !== null &&
		(value as IDirectiveResult).__directive === true &&
		typeof (value as IDirectiveResult).render === 'function'
	);
}
