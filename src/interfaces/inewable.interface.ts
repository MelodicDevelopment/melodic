export interface INewable {
	new (...args: any[]): any;
	params?: unknown[];
}
