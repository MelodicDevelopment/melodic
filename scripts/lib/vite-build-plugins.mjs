/**
 * Build-only Vite plugins shared by the two CDN bundle configs
 * (`vite.config.bundle.ts` and `packages/melodic-components/vite.config.bundle.ts`).
 *
 * Nothing here runs for the `lib/` (tsc) output or the dev server.
 */
import { transform } from 'esbuild';

/**
 * Really minifies an ES-format library bundle.
 *
 * Why this exists: in lib mode with `formats: ['es']`, Vite deliberately keeps
 * whitespace when minifying, to preserve `/* @__PURE__ *\/` annotations for a
 * downstream bundler. That is the right call for a package entry point and the
 * wrong one for a file served straight from a CDN: through 4.0.1 the "min"
 * bundles were thousands of indented lines and gzipped LARGER than the
 * unminified ones. Nobody tree-shakes a CDN bundle, so minify it fully.
 *
 * Use with `build.minify: false` so the chunk is minified exactly once.
 *
 * @param {{ target?: string }} [options]
 * @returns {import('vite').Plugin}
 */
export function minifyEsLibPlugin(options = {}) {
	const target = options.target ?? 'es2022';

	return {
		name: 'melodic:minify-es-lib',
		apply: 'build',
		enforce: 'post',
		// generateBundle, not renderChunk: the bundler reprints a chunk after
		// renderChunk, which puts the whitespace straight back.
		async generateBundle(outputOptions, bundle) {
			if (outputOptions.format !== 'es' && outputOptions.format !== 'esm') {
				return;
			}
			for (const output of Object.values(bundle)) {
				if (output.type !== 'chunk') {
					continue;
				}
				const result = await transform(output.code, {
					format: 'esm',
					target,
					minify: true,
					legalComments: 'none',
					sourcemap: false
				});
				output.code = result.code;
				output.map = null;
			}
		}
	};
}

// Commas are deliberately absent: `var(--a, b)` keeps its fallback verbatim,
// so the space after the comma is left exactly as the author wrote it.
const NO_SPACE_AFTER = new Set(['{', '}', ';']);
const NO_SPACE_BEFORE = new Set(['{', '}', ';']);

/**
 * Minifies one static chunk of CSS source text: drops comments, collapses
 * whitespace, and removes the spaces around `{ } ;`. Deliberately
 * conservative — it never touches `:` (a space before a pseudo-class is a
 * descendant combinator), never rewrites values, and copies quoted strings
 * and backslash escapes through verbatim.
 *
 * Returns `null` when the chunk cannot be handled safely (an unterminated
 * comment or string, which means it continues past an interpolation); the
 * caller then leaves the whole literal alone.
 *
 * @param {string} text
 * @param {{ atStart: boolean, atEnd: boolean }} edges whether the chunk touches
 *   the start/end of the literal (where whitespace can go entirely) or an
 *   interpolation (where one space must survive).
 * @returns {string | null}
 */
export function minifyCssChunk(text, edges) {
	let output = '';
	let pendingSpace = false;
	let index = 0;

	const emit = (value) => {
		if (pendingSpace) {
			const last = output[output.length - 1];
			const first = value[0];
			const atChunkStart = output.length === 0;
			const dropForStart = atChunkStart && edges.atStart;
			const dropAfter = !atChunkStart && NO_SPACE_AFTER.has(last);
			// `--toggle: ;` (a custom property holding a single space) must keep it.
			const dropBefore = NO_SPACE_BEFORE.has(first) && !(first === ';' && last === ':');
			if (!dropForStart && !dropAfter && !dropBefore) {
				output += ' ';
			}
			pendingSpace = false;
		}
		output += value;
	};

	while (index < text.length) {
		const char = text[index];

		if (char === '/' && text[index + 1] === '*') {
			const end = text.indexOf('*/', index + 2);
			if (end === -1) {
				return null;
			}
			// A comment separates tokens exactly like whitespace does.
			pendingSpace = true;
			index = end + 2;
			continue;
		}

		if (char === '"' || char === "'") {
			let end = index + 1;
			while (end < text.length && text[end] !== char) {
				end += text[end] === '\\' ? 2 : 1;
			}
			if (end >= text.length) {
				return null;
			}
			emit(text.slice(index, end + 1));
			index = end + 1;
			continue;
		}

		if (char === '\\') {
			emit(text.slice(index, index + 2));
			index += 2;
			continue;
		}

		if (char === ' ' || char === '\t' || char === '\n' || char === '\r' || char === '\f') {
			pendingSpace = true;
			index += 1;
			continue;
		}

		emit(char);
		index += 1;
	}

	if (pendingSpace && !edges.atEnd) {
		output += ' ';
	}
	return output;
}

/**
 * Skips a JavaScript expression inside `${ ... }`, starting just after the
 * `${`. Returns the index just after the matching `}`, or -1.
 */
function skipInterpolation(source, start) {
	let depth = 1;
	let index = start;
	while (index < source.length) {
		const char = source[index];
		if (char === '\\') {
			index += 2;
			continue;
		}
		if (char === '"' || char === "'") {
			index += 1;
			while (index < source.length && source[index] !== char) {
				index += source[index] === '\\' ? 2 : 1;
			}
			index += 1;
			continue;
		}
		if (char === '`') {
			index = skipTemplate(source, index + 1);
			if (index === -1) {
				return -1;
			}
			continue;
		}
		if (char === '/' && source[index + 1] === '/') {
			const end = source.indexOf('\n', index);
			index = end === -1 ? source.length : end;
			continue;
		}
		if (char === '/' && source[index + 1] === '*') {
			const end = source.indexOf('*/', index + 2);
			if (end === -1) {
				return -1;
			}
			index = end + 2;
			continue;
		}
		if (char === '{') {
			depth += 1;
		} else if (char === '}') {
			depth -= 1;
			if (depth === 0) {
				return index + 1;
			}
		}
		index += 1;
	}
	return -1;
}

/** Skips a template literal body, starting just after the opening backtick. */
function skipTemplate(source, start) {
	let index = start;
	while (index < source.length) {
		const char = source[index];
		if (char === '\\') {
			index += 2;
			continue;
		}
		if (char === '`') {
			return index + 1;
		}
		if (char === '$' && source[index + 1] === '{') {
			index = skipInterpolation(source, index + 2);
			if (index === -1) {
				return -1;
			}
			continue;
		}
		index += 1;
	}
	return -1;
}

/**
 * Splits a template literal body (starting just after the opening backtick)
 * into alternating static chunks and `${...}` interpolations.
 *
 * @returns {{ end: number, parts: Array<{ type: 'static' | 'expr', text: string }> } | null}
 */
function splitTemplate(source, start) {
	const parts = [];
	let chunkStart = start;
	let index = start;
	while (index < source.length) {
		const char = source[index];
		if (char === '\\') {
			index += 2;
			continue;
		}
		if (char === '`') {
			parts.push({ type: 'static', text: source.slice(chunkStart, index) });
			return { end: index + 1, parts };
		}
		if (char === '$' && source[index + 1] === '{') {
			const end = skipInterpolation(source, index + 2);
			if (end === -1) {
				return null;
			}
			parts.push({ type: 'static', text: source.slice(chunkStart, index) });
			parts.push({ type: 'expr', text: source.slice(index, end) });
			chunkStart = end;
			index = end;
			continue;
		}
		index += 1;
	}
	return null;
}

/**
 * Minifies the CSS inside every css`...` tagged template in a module's source.
 * Interpolations are preserved verbatim. A literal that cannot be handled
 * safely is left exactly as written.
 *
 * @param {string} source
 * @returns {string} the transformed source (the same string when nothing changed)
 */
export function minifyCssLiterals(source) {
	// Only a tag in expression position counts (`=> css\``, `= css\``,
	// `return css\``, an argument...). Prose such as "a `css` result" inside a
	// comment must not be mistaken for the start of a literal.
	const tag = /(?:=>|[=(,:?[]|\breturn)\s*css`/g;
	let output = '';
	let cursor = 0;
	let match;

	while ((match = tag.exec(source)) !== null) {
		const bodyStart = match.index + match[0].length;
		const template = splitTemplate(source, bodyStart);
		if (!template) {
			continue;
		}

		let body = '';
		let safe = true;
		const lastIndex = template.parts.length - 1;
		for (let index = 0; index <= lastIndex; index += 1) {
			const part = template.parts[index];
			if (part.type === 'expr') {
				body += part.text;
				continue;
			}
			const minified = minifyCssChunk(part.text, { atStart: index === 0, atEnd: index === lastIndex });
			if (minified === null) {
				safe = false;
				break;
			}
			body += minified;
		}

		if (safe) {
			output += source.slice(cursor, bodyStart) + body + '`';
			cursor = template.end;
		}
		tag.lastIndex = template.end;
	}

	return cursor === 0 ? source : output + source.slice(cursor);
}

/**
 * Strips comments and whitespace from css`...` template literals at build time.
 *
 * Component stylesheets are template literals, which a JS minifier treats as
 * opaque strings — so every indent, blank line and the token documentation
 * block at the top of each `*.styles.ts` shipped to the browser and was parsed
 * as CSS on first render. This removes them from the CDN bundle only; the
 * source files keep their documentation.
 *
 * @returns {import('vite').Plugin}
 */
export function minifyCssLiteralsPlugin() {
	return {
		name: 'melodic:minify-css-literals',
		apply: 'build',
		enforce: 'pre',
		transform(code, id) {
			const file = id.split('?')[0];
			if (!/\.(ts|js|mjs)$/.test(file) || file.includes('/node_modules/') || !code.includes('css`')) {
				return null;
			}
			const result = minifyCssLiterals(code);
			return result === code ? null : { code: result, map: null };
		}
	};
}
