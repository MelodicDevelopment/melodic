import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * esm.sh builds each `exports`-map entry into a standalone module and rewrites
 * cross-entry imports. Runtime `export *` chains at an entry point defeat its
 * re-export analysis: the served entry silently loses names (e.g. `Injectable`
 * vanished from /es2022/injection.mjs in 3.0.0 while state.mjs still imported
 * it), breaking bare CDN consumers before any user code runs. The package is
 * internally consistent, so no runtime test catches this — only the invariant
 * does: every entry barrel must use explicit named re-exports for values.
 * Type-only re-exports (`export type *`) emit nothing and are safe.
 */
const ENTRY_BARRELS = [
	'src/index.ts',
	'src/bootstrap/index.ts',
	'src/components/index.ts',
	'src/config/index.ts',
	'src/forms/index.ts',
	'src/http/index.ts',
	'src/injection/index.ts',
	'src/interfaces/index.ts',
	'src/routing/index.ts',
	'src/signals/index.ts',
	'src/state/index.ts',
	'src/template/index.ts',
];

describe('exports-map entry barrels', () => {
	it('matches the package.json exports map', () => {
		const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8')) as {
			exports: Record<string, unknown>;
		};
		const fromPkg = Object.keys(pkg.exports)
			.map((key) => (key === '.' ? 'src/index.ts' : `src/${key.slice(2)}/index.ts`))
			.sort();
		expect(fromPkg).toEqual([...ENTRY_BARRELS].sort());
	});

	it.each(ENTRY_BARRELS)('%s has no runtime `export *`', (file) => {
		const source = readFileSync(resolve(__dirname, '../..', file), 'utf8');
		const runtimeStars = source.match(/^\s*export\s+\*\s+from.+$/gm) ?? [];
		expect(runtimeStars, `runtime \`export *\` breaks esm.sh entry builds — use explicit named exports (types may use \`export type *\`)`).toEqual([]);
	});
});
