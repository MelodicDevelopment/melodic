import type { Token } from '../injection-engine.class';

export interface IInjectableMeta {
	token?: Token; // Optional - defaults to the class itself
	dependencies?: Token[];
	args?: unknown[];
	singleton?: boolean;
}
