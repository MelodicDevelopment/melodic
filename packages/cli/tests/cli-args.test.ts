import { describe, expect, it } from 'vitest';
import { parseCliArgs } from '../src/cli.js';

describe('parseCliArgs', () => {
	it('does not swallow positionals after boolean flags', () => {
		const { positionals, options } = parseCliArgs(['init', '--monorepo', 'my-repo']);
		expect(positionals).toEqual(['init', 'my-repo']);
		expect(options.monorepo).toBe(true);
	});

	it('parses string options with values', () => {
		const { positionals, options } = parseCliArgs(['init', 'my-repo', '--monorepo', '--app-name', 'web']);
		expect(positionals).toEqual(['init', 'my-repo']);
		expect(options.monorepo).toBe(true);
		expect(options['app-name']).toBe('web');
	});

	it('parses generate flags', () => {
		const { positionals, options } = parseCliArgs(['g', 'component', 'card', '--path', 'src/ui', '--dry-run', '--force']);
		expect(positionals).toEqual(['g', 'component', 'card']);
		expect(options.path).toBe('src/ui');
		expect(options['dry-run']).toBe(true);
		expect(options.force).toBe(true);
	});

	it('supports short help/version flags', () => {
		expect(parseCliArgs(['-h']).options.help).toBe(true);
		expect(parseCliArgs(['-v']).options.version).toBe(true);
	});

	it('throws on unknown options', () => {
		expect(() => parseCliArgs(['g', 'class', 'foo', '--bogus'])).toThrow(/Unknown option/);
	});
});
