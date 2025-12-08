import type { Token } from '../types/token.type';

export interface IClassBindingOptions {
	singleton?: boolean;
	dependencies?: Token<unknown>[];
	args?: unknown[];
}
