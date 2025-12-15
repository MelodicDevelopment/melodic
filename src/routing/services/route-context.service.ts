import { Injectable } from '../../injection/decorators/injectable.decorator';
import type { IRoute } from '../interfaces/iroute.interface';
import type { IRouteMatch } from '../interfaces/iroute-match.interface';
import type { IRouteMatchResult } from '../interfaces/iroute-match-result.interface';
import type { IRouteContext } from '../interfaces/iroute-context.interface';

@Injectable()
export class RouteContextService {
	private _matchStack: IRouteMatch[] = [];
	private _contexts: Map<number, IRouteContext> = new Map();
	private _currentMatchResult: IRouteMatchResult | null = null;
	private _resolvedData: Map<number, Record<string, unknown>> = new Map();

	setMatchResult(result: IRouteMatchResult): void {
		this._currentMatchResult = result;
		this._matchStack = result.matches;

		this._contexts.clear();

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
				parent: i > 0 ? this._contexts.get(i - 1) : undefined
			};

			this._contexts.set(i, context);
			basePath = match.fullPath;
		}
	}

	setResolvedData(depth: number, data: Record<string, unknown>): void {
		this._resolvedData.set(depth, data);
	}

	clearResolvedData(): void {
		this._resolvedData.clear();
	}

	getContextForDepth(depth: number): IRouteContext | undefined {
		return this._contexts.get(depth);
	}

	getChildRoutesForDepth(depth: number): IRoute[] {
		const parentContext = this._contexts.get(depth - 1);

		if (depth === 0) {
			return [];
		}

		return parentContext?.currentMatch?.children ?? [];
	}

	getRemainingPathForDepth(depth: number): string {
		if (depth === 0) {
			return window.location.pathname;
		}

		const parentContext = this._contexts.get(depth - 1);

		return parentContext?.remainingPath ?? '';
	}

	getParamsForDepth(depth: number): Record<string, string> {
		const context = this._contexts.get(depth);
		return context?.params ?? {};
	}

	getCurrentParams(): Record<string, string> {
		return this._currentMatchResult?.params ?? {};
	}

	getMatchStack(): IRouteMatch[] {
		return [...this._matchStack];
	}

	getCurrentMatchResult(): IRouteMatchResult | null {
		return this._currentMatchResult;
	}

	getMergedRouteData(depth?: number): Record<string, unknown> {
		const maxDepth = depth ?? this._matchStack.length - 1;
		const merged: Record<string, unknown> = {};

		for (let i = 0; i <= maxDepth && i < this._matchStack.length; i++) {
			const match = this._matchStack[i];
			if (match.route.data) {
				Object.assign(merged, match.route.data);
			}
		}

		return merged;
	}

	getMergedResolvedData(depth?: number): Record<string, unknown> {
		const maxDepth = depth ?? this._matchStack.length - 1;
		const merged: Record<string, unknown> = {};

		for (let i = 0; i <= maxDepth; i++) {
			const data = this._resolvedData.get(i);
			if (data) {
				Object.assign(merged, data);
			}
		}

		return merged;
	}

	getResolvedDataForDepth(depth: number): Record<string, unknown> | undefined {
		return this._resolvedData.get(depth);
	}
}
