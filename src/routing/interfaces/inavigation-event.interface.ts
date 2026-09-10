import type { IRouteMatchResult } from './iroute-match-result.interface';

/**
 * Lifecycle of a single navigation.
 *
 * - `start` — a navigation was claimed (before deactivation guards run)
 * - `redirect` — the pipeline is handing off to another URL (route `redirectTo`
 *   or a guard returning a path)
 * - `blocked` — a guard returned `false`
 * - `error` — a resolver, a lazy load, or the redirect limit failed it
 * - `superseded` — a newer navigation started while this one was awaiting
 * - `end` — the match result was committed
 */
export type NavigationEventType = 'start' | 'redirect' | 'blocked' | 'error' | 'superseded' | 'end';

export interface INavigationEvent {
	type: NavigationEventType;
	/** Monotonic id shared by every event of one navigation. */
	id: number;
	/** Target URL of this navigation (path + query + hash). */
	url: string;
	/** How the navigation was triggered. */
	trigger: 'imperative' | 'popstate' | 'initial';
	/** Present on `end`. */
	result?: IRouteMatchResult;
	/** Present on `redirect` — the URL being redirected to. */
	redirectTo?: string;
	/** Present on `error` and `blocked`. */
	error?: string;
}
