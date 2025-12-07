import type { Token } from '../types/token.type';

export interface IInjectableMeta<T = unknown> {
	token?: Token<T>; // Optional - defaults to the class itself
	dependencies?: Token<unknown>[];
	args?: unknown[];
	singleton?: boolean;
}
