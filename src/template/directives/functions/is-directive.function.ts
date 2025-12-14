import type { IDirectiveResult } from '../interfaces/idirective-result.interface';

export function isDirective(value: unknown): value is IDirectiveResult {
	return typeof value === 'object' && value !== null && '__directive' in value;
}
