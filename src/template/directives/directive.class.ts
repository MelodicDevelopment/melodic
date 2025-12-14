import type { IDirectiveResult } from './interfaces/idirective-result.interface';

export abstract class Directive implements IDirectiveResult {
	abstract render(container: Node, previousState?: any): any;

	__directive = true as const;
}
