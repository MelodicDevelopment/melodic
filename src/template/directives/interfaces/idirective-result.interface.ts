export interface IDirectiveResult {
	__directive: true;
	/**
	 * Identity of the directive factory that produced this result (e.g. 'when',
	 * 'repeat'). The engine stamps it on the template part so a binding that
	 * switches between two different directive types never receives the previous
	 * directive's state. Directives created without a type are all treated as
	 * the same (untyped) directive.
	 */
	type?: string | symbol;
	render(container: Node, previousState?: any): any;
}
