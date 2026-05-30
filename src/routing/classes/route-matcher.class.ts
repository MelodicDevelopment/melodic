type RuleCheck = (value: string) => boolean;
type Rule = RegExp | RuleCheck | string;
type Rules = { [key: string]: Rule };
type RouteMatchParams = { [key: string]: string } | null;

export class RouteMatcher {
	private _reEscape: RegExp = /[-[\]{}()+?.,\\^$|#\s*]/g;
	// Matches, in priority order: ** (catch-all), :name, *name (named splat), * (bare splat).
	private _reToken: RegExp = /(\*\*)|:(\w+)|\*(\w+)|(\*)/g;
	private _reParam: RegExp = /([:*])(\w+)/g;
	private _names: string[] = [];
	private _route: string;
	private _routeRegex: RegExp;
	private _prefixRegex: RegExp;
	private _rules: Rules | undefined;
	private _isWildcard: boolean = false;

	constructor(route: string, rules?: Rules) {
		this._route = route;
		this._rules = rules;
		this._isWildcard = route.includes('*');

		const escapedRoute = this.buildPattern(route);

		this._routeRegex = new RegExp('^' + escapedRoute + '$');
		this._prefixRegex = new RegExp('^' + escapedRoute + '(?:/|$)');
	}

	/**
	 * Translate a route pattern into a regex source. Param/wildcard tokens become
	 * capture groups; everything else is escaped literally. `*` is escaped in the
	 * literal segments too, so a standalone `*`/`**` can never leak through and
	 * produce an invalid pattern like `/^**$/`.
	 */
	private buildPattern(route: string): string {
		this._reToken.lastIndex = 0;
		let pattern = '';
		let lastIndex = 0;
		let anonCount = 0;
		let match: RegExpExecArray | null;

		while ((match = this._reToken.exec(route)) !== null) {
			pattern += route.slice(lastIndex, match.index).replace(this._reEscape, '\\$&');

			if (match[1] || match[4]) {
				// ** or bare * — anonymous catch-all
				this._names.push(`_wildcard${anonCount++}`);
				pattern += '(.*)';
			} else if (match[2]) {
				// :name — single path segment
				this._names.push(match[2]);
				pattern += '([^/]*)';
			} else if (match[3]) {
				// *name — named catch-all
				this._names.push(match[3]);
				pattern += '(.*)';
			}

			lastIndex = this._reToken.lastIndex;
		}

		pattern += route.slice(lastIndex).replace(this._reEscape, '\\$&');
		return pattern;
	}

	private decode(value: string): string {
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	}

	public parse(url: string): RouteMatchParams {
		let i: number = 0;
		let param: Rule;
		let value: string;
		const params: RouteMatchParams = {};
		const matches: RegExpMatchArray | null = url.match(this._routeRegex);

		if (!matches) {
			return null;
		}

		while (i < this._names.length) {
			param = this._names[i++];
			value = this.decode(matches[i]);

			if (this._rules && param in this._rules && !this.validateRule(this._rules[param], value)) {
				return null;
			}

			params[param] = value;
		}

		return params;
	}

	public parsePrefix(url: string): { params: RouteMatchParams; matchedPath: string; remainingPath: string } | null {
		if (this._route === '') {
			return {
				params: {},
				matchedPath: '',
				remainingPath: url
			};
		}

		const matches = url.match(this._prefixRegex);
		if (!matches) {
			return null;
		}

		const params: RouteMatchParams = {};
		for (let i = 0; i < this._names.length; i++) {
			const name = this._names[i];
			const value = this.decode(matches[i + 1]);

			if (this._rules && name in this._rules && !this.validateRule(this._rules[name], value)) {
				return null;
			}

			params[name] = value;
		}

		const matchedPath = this.calculateMatchedPath(url);
		const remainingPath = url.slice(matchedPath.length).replace(/^\//, '');

		return { params, matchedPath, remainingPath };
	}

	public stringify(params: Record<string, string>): string {
		let re: RegExp;
		let result: string = this._route;

		for (const param in params) {
			re = new RegExp('[:*]' + param + '\\b');
			result = result.replace(re, params[param]);
		}

		// Strip any unfilled :name/*name params and standalone */** wildcards.
		return result.replace(this._reParam, '').replace(/\*+/g, '');
	}

	private calculateMatchedPath(url: string): string {
		if (this._isWildcard) {
			return url;
		}

		const routeSegments = this._route.split('/').filter(Boolean);
		const urlSegments = url.split('/').filter(Boolean);

		const matchedSegments = urlSegments.slice(0, routeSegments.length);
		return matchedSegments.join('/');
	}

	private validateRule(rule: Rule, value: string): boolean {
		const type: string = Object.prototype.toString.call(rule).charAt(8);
		return type === 'R' ? (rule as RegExp).test(value) : type === 'F' ? (rule as RuleCheck)(value) : rule === value;
	}
}
