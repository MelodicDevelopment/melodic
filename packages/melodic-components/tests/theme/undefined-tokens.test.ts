import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { allTokens } from '../../src/theme/tokens/all-tokens';
import { darkTheme } from '../../src/theme/presets/dark.preset';
import { lightTheme } from '../../src/theme/presets/light.preset';

/**
 * Ten global tokens (`--ml-color-error`, `--ml-color-surface-hover`, …) were
 * read by component styles for months without ever being defined, so every
 * rule that ended in one of them silently did nothing. A `var(--ml-x)` with no
 * fallback must name a token that exists: in the theme, or declared by some
 * component stylesheet or template.
 */
const SRC = join(__dirname, '../../src');

function sourceFiles(dir: string, suffix: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			return sourceFiles(full, suffix);
		}
		return entry.endsWith(suffix) ? [full] : [];
	});
}

function stripComments(source: string): string {
	return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('tokens read by components', () => {
	// Every component source file, not only stylesheets: the slider builds its
	// fill width in the component class (`calc(… * var(--ml-slider-thumb-size))`),
	// and that read lost its value when the `:host` token blocks went in 4.0.1.
	const files = sourceFiles(join(SRC, 'components'), '.ts').map((file) => ({ file, css: stripComments(readFileSync(file, 'utf-8')) }));

	it('finds the component sources', () => {
		expect(files.filter(({ file }) => file.endsWith('.styles.ts')).length).toBeGreaterThan(50);
	});

	it('every var(--ml-x) with no fallback names a defined token', () => {
		const defined = new Set<string>([...Object.keys(allTokens), ...Object.keys(darkTheme), ...Object.keys(lightTheme)]);
		// A stylesheet may declare the token, or a template may set it inline
		// (`style="--ml-afi-indicator-bg: …"`), so every source file counts.
		for (const file of sourceFiles(SRC, '.ts')) {
			for (const match of stripComments(readFileSync(file, 'utf-8')).matchAll(/(--ml-[a-z0-9-]+)\s*:/g)) {
				defined.add(match[1]);
			}
		}

		const undefinedReads: string[] = [];
		for (const { file, css } of files) {
			for (const match of css.matchAll(/var\(\s*(--ml-[a-z0-9-]+)\s*\)/g)) {
				if (!defined.has(match[1])) {
					undefinedReads.push(`${relative(SRC, file)}: ${match[1]}`);
				}
			}
		}

		expect([...new Set(undefinedReads)].sort()).toEqual([]);
	});

	it('the alias tokens resolve to existing tokens', () => {
		const tokens: Record<string, string> = allTokens;
		const aliases = [
			'--ml-color-error',
			'--ml-color-error-subtle',
			'--ml-color-surface-hover',
			'--ml-color-surface-secondary',
			'--ml-color-surface-tertiary',
			'--ml-color-bg-secondary',
			'--ml-color-text-tertiary',
			'--ml-color-text-disabled',
			'--ml-font-regular',
			'--ml-transition-normal'
		];

		for (const alias of aliases) {
			const value = tokens[alias];
			expect(value, alias).toBeTruthy();
			for (const ref of value.matchAll(/var\((--ml-[a-z0-9-]+)\)/g)) {
				expect(tokens[ref[1]], `${alias} -> ${ref[1]}`).toBeTruthy();
			}
		}
	});

	it('dark mode restates the colour aliases next to the tokens they follow', () => {
		const dark: Record<string, string> = darkTheme;
		expect(dark['--ml-color-error']).toBe('var(--ml-color-danger)');
		expect(dark['--ml-color-surface-hover']).toBe('var(--ml-color-surface-raised)');
		expect(dark['--ml-color-text-tertiary']).toBe('var(--ml-color-text-muted)');
	});
});
