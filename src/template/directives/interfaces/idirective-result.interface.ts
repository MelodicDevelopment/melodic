export interface IDirectiveResult {
	__directive: true;
	render(container: Node, previousState?: any): any;
}
