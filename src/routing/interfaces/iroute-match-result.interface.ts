import type { IRouteMatch } from './iroute-match.interface';

export interface IRouteMatchResult {
	matches: IRouteMatch[];
	params: Record<string, string>;
	isExactMatch: boolean;
	redirectTo?: string;
}
