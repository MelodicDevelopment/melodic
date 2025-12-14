import { Injectable } from '../../injection/decorators/injectable.decorator';
import type { IRoute, IRouteMatch, IRouteMatchResult } from '../interfaces/iroute.interface';
import type { IRouteContext } from '../interfaces/iroute-context.interface';

/**
 * Custom event name for route context propagation.
 */
export const ROUTE_CONTEXT_EVENT = 'melodic:route-context';

/**
 * Custom event for passing route context to child outlets.
 */
export class RouteContextEvent extends CustomEvent<IRouteContext> {
	constructor(context: IRouteContext) {
		super(ROUTE_CONTEXT_EVENT, {
			bubbles: false, // Don't bubble - we use capture phase
			composed: true, // Cross shadow DOM boundaries
			detail: context
		});
	}
}

/**
 * Service for managing route context across nested router outlets.
 * Each outlet can request its context from ancestors.
 */
@Injectable({
	token: 'RouteContext',
	singleton: true
})
export class RouteContextService {
	/** Stack of active route matches (root to leaf) */
	#matchStack: IRouteMatch[] = [];

	/** Map of outlet depth to their current context */
	#contexts: Map<number, IRouteContext> = new Map();

	/** Current full match result */
	#currentMatchResult: IRouteMatchResult | null = null;

	/** Resolved data per depth level */
	#resolvedData: Map<number, Record<string, unknown>> = new Map();

	/**
	 * Update the current route match result.
	 * Called by the root router when navigation occurs.
	 */
	setMatchResult(result: IRouteMatchResult): void {
		this.#currentMatchResult = result;
		this.#matchStack = result.matches;

		// Clear old contexts (resolved data is cleared by #runResolvers before storing new data)
		this.#contexts.clear();

		// Build contexts for each depth level
		let basePath = '';
		const ancestorMatches: IRouteMatch[] = [];
		const accumulatedParams: Record<string, string> = {};

		for (let i = 0; i < result.matches.length; i++) {
			const match = result.matches[i];
			ancestorMatches.push(match);
			Object.assign(accumulatedParams, match.params);

			const context: IRouteContext = {
				depth: i,
				routes: match.children ?? [],
				currentMatch: match,
				ancestorMatches: [...ancestorMatches],
				params: { ...accumulatedParams },
				remainingPath: match.remainingPath,
				basePath: basePath,
				parent: i > 0 ? this.#contexts.get(i - 1) : undefined
			};

			this.#contexts.set(i, context);
			basePath = match.fullPath;
		}
	}

	/**
	 * Set resolved data for a specific depth level.
	 */
	setResolvedData(depth: number, data: Record<string, unknown>): void {
		this.#resolvedData.set(depth, data);
	}

	/**
	 * Clear all resolved data.
	 */
	clearResolvedData(): void {
		this.#resolvedData.clear();
	}

	/**
	 * Get the route context for a specific depth level.
	 */
	getContextForDepth(depth: number): IRouteContext | undefined {
		return this.#contexts.get(depth);
	}

	/**
	 * Get the child routes for a specific depth level.
	 * Returns routes that should be rendered in the outlet at that depth.
	 */
	getChildRoutesForDepth(depth: number): IRoute[] {
		const parentContext = this.#contexts.get(depth - 1);
		if (depth === 0) {
			// Root level - routes come from the outlet's routes property
			return [];
		}
		return parentContext?.currentMatch?.children ?? [];
	}

	/**
	 * Get the remaining path that the outlet at this depth should match against.
	 */
	getRemainingPathForDepth(depth: number): string {
		if (depth === 0) {
			return window.location.pathname;
		}
		const parentContext = this.#contexts.get(depth - 1);
		return parentContext?.remainingPath ?? '';
	}

	/**
	 * Get all accumulated route parameters up to and including the specified depth.
	 */
	getParamsForDepth(depth: number): Record<string, string> {
		const context = this.#contexts.get(depth);
		return context?.params ?? {};
	}

	/**
	 * Get current route parameters (from all matched routes).
	 */
	getCurrentParams(): Record<string, string> {
		return this.#currentMatchResult?.params ?? {};
	}

	/**
	 * Get the current match stack.
	 */
	getMatchStack(): IRouteMatch[] {
		return [...this.#matchStack];
	}

	/**
	 * Get the full current match result.
	 */
	getCurrentMatchResult(): IRouteMatchResult | null {
		return this.#currentMatchResult;
	}

	/**
	 * Get route data merged from all ancestors up to the specified depth.
	 */
	getMergedRouteData(depth?: number): Record<string, unknown> {
		const maxDepth = depth ?? this.#matchStack.length - 1;
		const merged: Record<string, unknown> = {};

		for (let i = 0; i <= maxDepth && i < this.#matchStack.length; i++) {
			const match = this.#matchStack[i];
			if (match.route.data) {
				Object.assign(merged, match.route.data);
			}
		}

		return merged;
	}

	/**
	 * Get resolved data merged from all ancestors up to the specified depth.
	 */
	getMergedResolvedData(depth?: number): Record<string, unknown> {
		const maxDepth = depth ?? this.#matchStack.length - 1;
		const merged: Record<string, unknown> = {};

		for (let i = 0; i <= maxDepth; i++) {
			const data = this.#resolvedData.get(i);
			if (data) {
				Object.assign(merged, data);
			}
		}

		return merged;
	}

	/**
	 * Get resolved data for a specific depth level only.
	 */
	getResolvedDataForDepth(depth: number): Record<string, unknown> | undefined {
		return this.#resolvedData.get(depth);
	}
}
