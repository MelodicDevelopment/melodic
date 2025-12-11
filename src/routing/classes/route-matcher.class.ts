type RuleCheck = (value: string) => boolean;
type Rule = RegExp | RuleCheck | string;
type Rules = { [key: string]: Rule };
type RouteMatchResult = { [key: string]: string } | null;

export class RouteMatcher {
	#reEscape: RegExp = /[-[\]{}()+?.,\\^$|#\s]/g;
	#reParam: RegExp = /([:*])(\w+)/g;
	#names: string[] = [];

	#route: string;
	#routeRegex: RegExp;
	#rules: Rules | undefined;

	constructor(route: string, rules?: Rules) {
		this.#route = route;
		this.#rules = rules;

		this.#route = this.#route.replace(this.#reEscape, '\\$&');
		this.#route = this.#route.replace(this.#reParam, (_, mode: string, name: string) => {
			this.#names.push(name);
			return mode === ':' ? '([^/]*)' : '(.*)';
		});

		this.#routeRegex = new RegExp('^' + this.#route + '$');
	}

	parse(url: string): RouteMatchResult {
		let i: number = 0;
		let param: Rule;
		let value: string;
		const params: RouteMatchResult = {};
		const matches: RegExpMatchArray | null = url.match(this.#routeRegex);

		if (!matches) {
			return null;
		}

		while (i < this.#names.length) {
			param = this.#names[i++];
			value = matches[i];

			if (this.#rules && param in this.#rules && !this.#validateRule(this.#rules[param], value)) {
				return null;
			}

			params[param] = value;
		}

		return params;
	}

	stringify(params: Record<string, string>): string {
		let re: RegExp;
		let result: string = this.#route;

		for (const param in params) {
			re = new RegExp('[:*]' + param + '\\b');
			result = result.replace(re, params[param]);
		}

		return result.replace(this.#reParam, '');
	}

	#validateRule(rule: Rule, value: string): boolean {
		const type: string = Object.prototype.toString.call(rule).charAt(8);
		return type === 'R' ? (rule as RegExp).test(value) : type === 'F' ? (rule as RuleCheck)(value) : rule == value;
	}
}
