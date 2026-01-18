type RuleCheck = (value: string) => boolean;
type Rule = RegExp | RuleCheck | string;
type Rules = { [key: string]: Rule };
type RouteMatchParams = { [key: string]: string } | null;

export class RouteMatcher {
	private _reEscape: RegExp = /[-[\]{}()+?.,\\^$|#\s]/g;
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

		let escapedRoute = this._route.replace(this._reEscape, '\\$&');
		escapedRoute = escapedRoute.replace(this._reParam, (_, mode: string, name: string) => {
			this._names.push(name);
			return mode === ':' ? '([^/]*)' : '(.*)';
		});

		this._routeRegex = new RegExp('^' + escapedRoute + '$');
		this._prefixRegex = new RegExp('^' + escapedRoute + '(?:/|$)');
	}

	parse(url: string): RouteMatchParams {
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
			value = matches[i];

			if (this._rules && param in this._rules && !this.validateRule(this._rules[param], value)) {
				return null;
			}

			params[param] = value;
		}

		return params;
	}

	parsePrefix(url: string): { params: RouteMatchParams; matchedPath: string; remainingPath: string } | null {
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
			const value = matches[i + 1];

			if (this._rules && name in this._rules && !this.validateRule(this._rules[name], value)) {
				return null;
			}

			params[name] = value;
		}

		const matchedPath = this.calculateMatchedPath(url);
		const remainingPath = url.slice(matchedPath.length).replace(/^\//, '');

		return { params, matchedPath, remainingPath };
	}

	stringify(params: Record<string, string>): string {
		let re: RegExp;
		let result: string = this._route;

		for (const param in params) {
			re = new RegExp('[:*]' + param + '\\b');
			result = result.replace(re, params[param]);
		}

		return result.replace(this._reParam, '');
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
