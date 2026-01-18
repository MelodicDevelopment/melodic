# Coding Practices

## Principles

- Keep changes small and focused; avoid unrelated refactors.
- Prefer clarity over cleverness; optimize only after measuring.
- Match existing patterns before introducing new ones.

Example:

```ts
// Good: single-purpose helper with clear name.
export function normalizeId(value: string): string {
	return value.trim().toLowerCase();
}
```

## Style & Formatting

- Use tabs in TypeScript sources.
- Use `import type` for type-only imports.
- Follow existing naming and file layout conventions.
- Components live in their own folder with separate template and styles files imported by the component.
- CSS styles should use nested selectors scoped under the component root class. When in doubt, follow BEM guidance: https://getbem.com/

Example:

```html
components/example/
  example.component.ts
  example.template.ts
  example.styles.ts
```

```ts
import { exampleTemplate } from './example.template';
import { exampleStyles } from './example.styles';
```

Example (nested styles):

```css
.ml-example {
	&__header {
		font-weight: var(--ml-font-semibold);
	}

	&--compact &__header {
		font-size: var(--ml-text-sm);
	}
}
```

## Prettier

- Follow `.prettierrc` settings for formatting.
- Key settings: tabs (`useTabs: true`, `tabWidth: 4`), single quotes, `printWidth: 160`, `trailingComma: none`, `quoteProps: consistent`.

Example:

```ts
const label = 'Compact';
const config = { label, size: 'sm' };
```

## Melodic Coding Standards

These standards cover JavaScript and TypeScript usage for this repo. Items tagged "Lint" are enforced by ESLint. Items tagged "Practice" must be followed manually.

### General (JavaScript)

- Use semicolons at the end of all statements. Lint.
- Always use curly braces around control structures (`if`, `else`, `for`, `do`, `while`). Lint.
- Opening braces stay on the same line as the control structure. Lint.
- Reduce nesting and prefer guard clauses. Practice.
- Avoid `else if` where a guard clause reads cleaner. Practice.
- Avoid `switch` when possible; if used, every case must `break` and include a `default`. Lint.
- Declare one variable per declaration. Lint.

Examples:

Fail:
```ts
if (val === 2) doSomething();
if (val === 2) doSomething();
else doSomethingElse();
```

Pass:
```ts
if (val === 2) {
	doSomething();
}

if (val === 2) {
	doSomething();
} else {
	doSomethingElse();
}
```

Fail:
```ts
if (myNumber > 0) {
	if (myNumber > 100) {
		if (!hasDiscountAlready) {
			return addDiscountPercent(0);
		} else {
			return addDiscountPercent(10);
		}
	} else if (myNumber > 50) {
		if (!hasDiscountAlready) {
			return addDiscountPercent(5);
		}
	} else {
		if (!hasDiscountAlready) {
			return addDiscountPercent(0);
		} else {
			return addDiscountPercent(1);
		}
	}
} else {
	error();
}
```

Pass:
```ts
if (myNumber <= 0) {
	return error();
}

if (!hasDiscountAlready) {
	return addDiscountPercent(0);
}

if (myNumber > 100) {
	return addDiscountPercent(10);
}

if (myNumber > 50) {
	return addDiscountPercent(5);
}

return addDiscountPercent(1);
```

Fail:
```ts
switch (myNumber) {
	case 10:
		addDiscountPercent(0);
	case 20:
		addDiscountPercent(2);
	case 30:
		addDiscountPercent(3);
}
```

Pass:
```ts
switch (myNumber) {
	case 10:
		addDiscountPercent(0);
		break;
	case 20:
		addDiscountPercent(2);
		break;
	case 30:
		addDiscountPercent(3);
		break;
	default:
		addDiscountPercent(0);
		break;
}
```

Fail:
```ts
const a = 2,
	b = 3;
```

Pass:
```ts
const a = 2;
const b = 3;
```

### TypeScript

- Use `===` instead of `==` for comparisons. Lint.
- Never use `var`. Prefer `const`, use `let` when reassignment is required. Lint.
- Prefer explicit types for variables, properties, arguments, and return values when inference is unclear or for public APIs. Practice.
- Avoid `any` as much as possible. Lint.
- Class names use PascalCase. Lint.
- Class properties appear before the constructor and are ordered `private`, `protected`, `public`. Lint.
- Private properties start with an underscore and are camelCased. Lint.
- Protected/public properties are camelCased without underscores. Lint.
- Class methods are camelCased; prefer explicit access modifiers, though `public` is optional. Practice.

Examples:

Fail:
```ts
if (val == 2) {
	doSomething();
}
```

Pass:
```ts
if (val === 2) {
	doSomething();
}
```

Fail:
```ts
var value: number = 100;
```

Pass:
```ts
const value1: number = 100;
let value2: number = 200;
```

Fail:
```ts
const value = 100;

class CarModel {
	private _value = 100;
}
```

Pass:
```ts
const value: number = 100;

class CarModel {
	private _value: number = 100;
}
```

Fail:
```ts
function callback() {
	return 'hello world';
}

class CarModel {
	callback() {
		return 'hello world';
	}
}
```

Pass:
```ts
function callback(): string {
	return 'hello world';
}

class CarModel {
	callback(): string {
		return 'hello world';
	}
}
```

Fail:
```ts
function callback(inputStr) {
	return inputStr;
}

class CarModel {
	callback(inputStr) {
		return inputStr;
	}
}
```

Pass:
```ts
function callback(inputStr: string): string {
	return inputStr;
}

class CarModel {
	callback(inputStr: string): string {
		return inputStr;
	}
}
```

Fail:
```ts
const value: any = 1;
```

Pass:
```ts
const value: number = 1;
```

Fail:
```ts
class carModel {}
```

Pass:
```ts
class CarModel {}
```

Fail:
```ts
class CarModel {
	constructor() {}
	TestPrivateProperty = 1;
	TestProtectedProperty = true;
	TestPublicProperty = 'I am public';
	TestPublicProperty2 = 'So am I';
}
```

Pass:
```ts
class CarModel {
	private _testPrivateProperty: number = 1;
	protected testProtectedProperty: boolean = true;
	public testPublicProperty: string = 'I am public';
	testPublicProperty2: string = 'So am I';

	constructor() {}
}
```

Fail:
```ts
class CarModel {
	TestPrivateMethod(): number {
		return 1;
	}

	TestProtectedMethod(): boolean {
		return true;
	}

	TestPublicMethod(): string {
		return 'I am public';
	}

	TestPublicMethod2() {
		return 'So am I';
	}
}
```

Pass:
```ts
class CarModel {
	private testPrivateMethod(): number {
		return 1;
	}

	protected testProtectedMethod(): boolean {
		return true;
	}

	public testPublicMethod(): string {
		return 'I am public';
	}

	testPublicMethod2(): string {
		return 'So am I';
	}
}
```

## Linting

- Run `npm run lint` to enforce the coding standards that map cleanly to ESLint rules.
- Use `npm run lint:fix` for safe auto-fixes.
- This repo uses `tools/standards/eslint.config.mjs` (explicit typing is encouraged but not required).
- The strict config lives in `tools/standards/eslint.config.strict.mjs` if you want full explicit typing enforcement.

## Error Handling

- Surface actionable errors with context.
- Prefer early returns and guards.
- Avoid swallowing exceptions; log and rethrow if needed.

Example:

```ts
if (!config.endpoint) {
	throw new Error('Missing config.endpoint for API client');
}
```

## Testing Expectations

- Add a focused demo in `web/example/` when behavior needs manual coverage.
- Run relevant dev flows (`npm run dev`, `npm run benchmark`) when changing runtime behavior.

Example:

```sh
web/example/components/new-feature-demo/
```

## Performance & DX

- Avoid unnecessary DOM churn; update only what changed.
- Cache computed values when inputs are stable.
- Keep public APIs minimal and predictable.

Example:

```ts
const cached = cache.get(key);
if (cached) return cached;
```

## Review Checklist

- Behavior matches requirements and edge cases are handled.
- No unnecessary API changes; exports updated when required.
- New demos or docs added if needed.
- Errors are clear and actionable.
