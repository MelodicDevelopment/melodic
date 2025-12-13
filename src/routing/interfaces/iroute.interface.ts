export interface IRoute {
	path: string;
	component?: string;
	redirectTo?: string;

	loadComponent?: () => Promise<unknown>;
}
