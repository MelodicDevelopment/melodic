export interface IRoute {
	path: string;
	component?: string;
	redirectTo?: string;
	/** Lazy load a component. Returns a promise that resolves when the component is registered. */
	loadComponent?: () => Promise<unknown>;
}
