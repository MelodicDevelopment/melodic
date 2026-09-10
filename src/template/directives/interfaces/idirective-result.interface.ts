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
	/**
	 * @param container the node the binding sits on
	 * @param previousState state this directive returned last render
	 * @param name for a property or attribute binding, the bound name — so a
	 *   directive such as `live()` knows which property it is standing in for
	 */
	render(container: Node, previousState?: any, name?: string): any;
}
