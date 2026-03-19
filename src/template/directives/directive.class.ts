import type { IDirectiveResult } from './interfaces/idirective-result.interface';

export abstract class Directive implements IDirectiveResult {
	public abstract render(container: Node, previousState?: any): any;

	public __directive = true as const;
}
