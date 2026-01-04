export interface INavigationOptions {
	data?: unknown;
	replace?: boolean;
	queryParams?: Record<string, string>;
	skipGuards?: boolean;
	skipResolvers?: boolean;
	scrollToTop?: boolean;
}
