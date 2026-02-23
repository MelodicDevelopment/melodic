/**
 * Generates assets/melodic.css — a static CSS bundle containing:
 *   - Phosphor icon @font-face declarations (paths adjusted for assets/ location)
 *   - Base design tokens (:root)
 *   - Light theme tokens
 *   - Dark theme tokens + prefers-color-scheme media query
 *
 * Run automatically as part of `npm run build` via the postbuild hook.
 * Output is included in the published package under assets/melodic.css.
 *
 * CDN usage:
 *   <link melodic-styles rel="stylesheet"
 *         href="https://unpkg.com/@melodicdev/components/assets/melodic.css">
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load compiled theme CSS strings from the tsc output
const { baseThemeCss } = await import(join(root, 'lib/theme/presets/base.preset.js'));
const { lightThemeCss } = await import(join(root, 'lib/theme/presets/light.preset.js'));
const { darkThemeCss } = await import(join(root, 'lib/theme/presets/dark.preset.js'));

// Read phosphor.css and rewrite relative font paths.
// Original paths are relative to assets/fonts/phosphor/ (where phosphor.css lives).
// melodic.css lives in assets/, so prefix with ./fonts/phosphor/.
const phosphorCss = readFileSync(join(root, 'assets/fonts/phosphor/phosphor.css'), 'utf-8').replace(/url\('\.\//g, "url('./fonts/phosphor/");

const banner = `/* @melodicdev/components — melodic.css
 * Includes: Phosphor icon fonts, design tokens, light theme, dark theme.
 * Source: https://github.com/MelodicDevelopment/melodic
 */`;

const sections = [
	banner,
	'/* ─── Phosphor Icon Fonts ─────────────────────────────────────────────────── */',
	phosphorCss.trim(),
	'/* ─── Base Design Tokens ──────────────────────────────────────────────────── */',
	baseThemeCss.trim(),
	'/* ─── Light Theme ─────────────────────────────────────────────────────────── */',
	lightThemeCss.trim(),
	'/* ─── Dark Theme ──────────────────────────────────────────────────────────── */',
	darkThemeCss.trim()
];

const css = sections.join('\n\n');

const outPath = join(root, 'assets/melodic-components.css');
writeFileSync(outPath, css);
console.log(`Generated ${outPath}`);

// Minified version — strip comments and collapse whitespace.
// Intentionally simple: no comma/colon collapsing to avoid breaking
// multi-value font-family, src lists, and CSS variable values.
const minified = css
	.replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
	.replace(/[ \t]*\n[ \t]*/g, '\n') // trim leading/trailing spaces on each line
	.replace(/\n{2,}/g, '\n')         // collapse blank lines
	.replace(/\{\n/g, '{')            // opening brace onto same line
	.replace(/;\n/g, ';')             // collapse semicolon line breaks
	.replace(/\}\n/g, '}')            // closing brace onto same line
	.trim();

const minPath = join(root, 'assets/melodic-components.min.css');
writeFileSync(minPath, minified);
console.log(`Generated ${minPath} (${(minified.length / 1024).toFixed(1)} kB)`);
