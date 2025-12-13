type RuleCheck = (value: string) => boolean;
type Rule = RegExp | RuleCheck | string;
type Rules = { [key: string]: Rule };
type RouteMatchResult = { [key: string]: string } | null;

export class RouteMatcher {
	private _reEscape: RegExp = /[-[\]{}()+?.,\\^$|#\s]/g;
	private _reParam: RegExp = /([:*])(\w+)/g;
	private _names: string[] = [];

	private _route: string;
	private _routeRegex: RegExp;
	private _rules: Rules | undefined;

	constructor(route: string, rules?: Rules) {
		this._route = route;
		this._rules = rules;

		this._route = this._route.replace(this._reEscape, '\\$&');
		this._route = this._route.replace(this._reParam, (_, mode: string, name: string) => {
			this._names.push(name);
			return mode === ':' ? '([^/]*)' : '(.*)';
		});

		this._routeRegex = new RegExp('^' + this._route + '$');
	}

	parse(url: string): RouteMatchResult {
		let i: number = 0;
		let param: Rule;
		let value: string;
		const params: RouteMatchResult = {};
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

	stringify(params: Record<string, string>): string {
		let re: RegExp;
		let result: string = this._route;

		for (const param in params) {
			re = new RegExp('[:*]' + param + '\\b');
			result = result.replace(re, params[param]);
		}

		return result.replace(this._reParam, '');
	}

	private validateRule(rule: Rule, value: string): boolean {
		const type: string = Object.prototype.toString.call(rule).charAt(8);
		return type === 'R' ? (rule as RegExp).test(value) : type === 'F' ? (rule as RuleCheck)(value) : rule == value;
	}
}
