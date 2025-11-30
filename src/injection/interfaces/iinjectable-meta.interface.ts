import type { Token } from '../types/token.type';

export interface IInjectableMeta {
	token?: Token; // Optional - defaults to the class itself
	dependencies?: Token[];
	args?: unknown[];
	singleton?: boolean;
}
