export interface INavigationOptions {
	data?: unknown;
	replace?: boolean;
	queryParams?: Record<string, string>;
	/**
	 * Skip both activation and deactivation guards. Redirects issued *by* a
	 * guard no longer set this — the redirect target's own guards always run.
	 */
	skipGuards?: boolean;
	skipResolvers?: boolean;
	scrollToTop?: boolean;
	/**
	 * What to do when the target URL equals the current one.
	 * `'ignore'` (default) leaves history and resolved data untouched and only
	 * re-applies scrolling; `'reload'` re-runs the whole pipeline and pushes a
	 * new history entry.
	 */
	onSameUrlNavigation?: 'ignore' | 'reload';
}
