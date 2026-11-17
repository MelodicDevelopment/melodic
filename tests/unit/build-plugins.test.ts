import { describe, expect, it } from 'vitest';
// Build-only helpers used by the CDN bundle configs (vite.config.bundle.ts).
import { minifyCssChunk, minifyCssLiterals } from '../../scripts/lib/vite-build-plugins.mjs';

const whole = { atStart: true, atEnd: true };

describe('minifyCssChunk', () => {
	it('drops comments and collapses whitespace', () => {
		const css = `
			/*
			 * Tokens
			 * --ml-button-bg: var(--ml-color-primary)
			 */
			:host {
				display: inline-block;
			}

			.ml-button:hover {
				color: red;
			}
		`;
		expect(minifyCssChunk(css, whole)).toBe(':host{display: inline-block;}.ml-button:hover{color: red;}');
	});

	it('keeps the space that makes a descendant combinator', () => {
		expect(minifyCssChunk('.a :hover { color: red }', whole)).toBe('.a :hover{color: red}');
		expect(minifyCssChunk('.a   >   .b { }', whole)).toBe('.a > .b{}');
	});

	it('leaves var() fallbacks and calc() operators intact', () => {
		expect(minifyCssChunk('a { width: calc(100% - var(--x, 2px)); }', whole)).toBe('a{width: calc(100% - var(--x, 2px));}');
		expect(minifyCssChunk('a { transition:\n\t\tcolor var(--d, 1s),\n\t\topacity 1s; }', whole)).toBe('a{transition: color var(--d, 1s), opacity 1s;}');
	});

	it('copies quoted strings and escapes through verbatim', () => {
		expect(minifyCssChunk(`a::before { content: "  /* not a comment */  { ; }  "; }`, whole)).toBe(
			`a::before{content: "  /* not a comment */  { ; }  ";}`
		);
		expect(minifyCssChunk(`a { content: '\\e900'; }`, whole)).toBe(`a{content: '\\e900';}`);
	});

	it('keeps a custom property whose value is a single space', () => {
		expect(minifyCssChunk('a { --toggle: ; color: red; }', whole)).toBe('a{--toggle: ;color: red;}');
	});

	it('keeps one space next to an interpolation', () => {
		// "margin: ${x} auto" — the chunk after the interpolation starts with a space.
		expect(minifyCssChunk(' auto; }', { atStart: false, atEnd: true })).toBe(' auto;}');
		expect(minifyCssChunk('a { margin: ', { atStart: true, atEnd: false })).toBe('a{margin: ');
	});

	it('refuses a chunk with an unterminated comment or string', () => {
		expect(minifyCssChunk('a { /* never closed', whole)).toBeNull();
		expect(minifyCssChunk(`a { content: "never closed`, whole)).toBeNull();
	});
});

describe('minifyCssLiterals', () => {
	it('minifies css`` literals and leaves the rest of the module alone', () => {
		const source = [
			"import { css } from '@melodicdev/core';",
			'',
			'export const styles = () => css`',
			'\t/* docs */',
			'\t:host {',
			'\t\tdisplay: block;',
			'\t}',
			'`;',
			'',
			'export const other = 1;   // untouched',
			''
		].join('\n');
		expect(minifyCssLiterals(source)).toBe(
			["import { css } from '@melodicdev/core';", '', 'export const styles = () => css`:host{display: block;}`;', '', 'export const other = 1;   // untouched', ''].join('\n')
		);
	});

	it('preserves interpolations verbatim, including nested templates and braces', () => {
		const source = 'const s = css`\n\ta { width: ${size}px; color: ${ dark ? `#${hex}` : pick({ a: 1 }) }; }\n`;';
		expect(minifyCssLiterals(source)).toBe('const s = css`a{width: ${size}px;color: ${ dark ? `#${hex}` : pick({ a: 1 }) };}`;');
	});

	it('ignores "css`" in prose and html`` templates', () => {
		const source = ['/**', ' * A `css` result is cached. Use `html`', ' * for   markup.', ' */', 'const t = html`<p>   spaced   </p>`;'].join('\n');
		expect(minifyCssLiterals(source)).toBe(source);
	});

	it('leaves a literal it cannot handle safely exactly as written', () => {
		const source = 'const s = css`a { /* ${note} */ color: red; }`;';
		expect(minifyCssLiterals(source)).toBe(source);
	});

	it('returns the same string when there is nothing to do', () => {
		const source = 'export const x = 1;';
		expect(minifyCssLiterals(source)).toBe(source);
	});
});
