import type { IRouteMatch } from './iroute-match.interface';

/**
 * Payload handed to a routed component's `onRouteChange` hook when the URL
 * changes but the component itself stays mounted (`/users/1 → /users/2`).
 */
export interface IRouteChange {
	params: Record<string, string>;
	queryParams: URLSearchParams;
	resolvedData: Record<string, unknown>;
	match: IRouteMatch;
}

/** Optional hook a routed component may implement. */
export interface IRouteChangeAware {
	onRouteChange?(change: IRouteChange): void;
}
