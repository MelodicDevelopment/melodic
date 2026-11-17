import { promises as fs } from 'node:fs';
import path from 'node:path';
import { toCamelCase, toKebabCase } from './utils.js';

/**
 * Valid kebab-case identifier for anything the CLI names or interpolates into
 * source: lowercase words of letters/digits joined by single hyphens. A leading,
 * trailing or doubled hyphen is rejected ("new-" used to produce `new-.directive.ts`).
 */
export const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Words that cannot be used as a binding name in an ES module (strict mode).
 * A generator that exports a bare camelCase identifier (`melodic g directive
 * delete` -> `export const delete = ...`) must refuse these.
 */
export const RESERVED_WORDS = new Set([
	'arguments', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
	'else', 'enum', 'eval', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'implements', 'import',
	'in', 'instanceof', 'interface', 'let', 'new', 'null', 'package', 'private', 'protected', 'public', 'return',
	'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'var', 'void', 'while', 'with',
	'yield'
]);

/**
 * Returns the camelCase identifier for a kebab-case name, refusing names whose
 * identifier is a reserved word and would not compile.
 */
export const toSafeIdentifier = (kebabName: string, label: string): string => {
	const identifier = toCamelCase(kebabName);
	if (RESERVED_WORDS.has(identifier)) {
		throw new Error(
			`${label} "${kebabName}" is a reserved word in JavaScript and cannot be used as an exported identifier. Use a more specific name (e.g. "${kebabName}-item").`
		);
	}
	return identifier;
};

/**
 * Names that contain a hyphen but are reserved by the HTML/SVG/MathML specs and
 * therefore may not be used as custom element names. Mirrors the validation in
 * @melodicdev/core's MelodicComponent decorator.
 */
export const RESERVED_SELECTORS = new Set([
	'annotation-xml',
	'color-profile',
	'font-face',
	'font-face-src',
	'font-face-uri',
	'font-face-format',
	'font-face-name',
	'missing-glyph'
]);

/**
 * Validates a user-supplied name and returns its kebab-case form.
 *
 * Rejects path separators and ".." before normalization (path traversal),
 * then requires the kebab-cased result to match NAME_PATTERN — which also
 * rules out quotes, backticks, "${" and anything else that could break out
 * of generated source or JSON (e.g. `melodic g service "o'brien"`).
 */
export const validateName = (raw: string, label: string): string => {
	if (typeof raw !== 'string' || raw.length === 0) {
		throw new Error(`${label} is required.`);
	}
	if (raw.includes('/') || raw.includes('\\') || raw.includes('..')) {
		throw new Error(`${label} "${raw}" must not contain path separators or "..".`);
	}
	const kebab = toKebabCase(raw);
	if (!NAME_PATTERN.test(kebab)) {
		throw new Error(`${label} "${raw}" is invalid. Use lowercase letters and digits in hyphen-separated words, starting with a letter (e.g. "user-card").`);
	}
	return kebab;
};

/**
 * Validates a user-supplied --path/--dir value: must be a relative path that
 * stays inside the project (no "..", no absolute paths, no drive letters).
 * Returns the value normalized to forward slashes without a trailing slash.
 */
export const validateRelativePath = (raw: string, label: string): string => {
	if (typeof raw !== 'string' || raw.length === 0) {
		throw new Error(`${label} is required.`);
	}
	if (path.isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw) || raw.startsWith('\\\\')) {
		throw new Error(`${label} "${raw}" must be a relative path inside the project.`);
	}
	const normalized = raw.replace(/\\/g, '/').replace(/\/+$/, '');
	const segments = normalized.split('/');
	if (segments.some((segment) => segment === '..' || segment === '')) {
		throw new Error(`${label} "${raw}" must not contain ".." or empty path segments.`);
	}
	return normalized;
};

/**
 * Removes a generator-type suffix from an already-kebab-cased name so that
 * `melodic g component user-card-component` doesn't produce
 * "UserCardComponentComponent". Names that consist solely of the suffix are
 * kept as-is.
 */
export const stripTypeSuffix = (kebabName: string, suffix: string): string => {
	if (kebabName === suffix || !kebabName.endsWith(`-${suffix}`)) {
		return kebabName;
	}
	return kebabName.slice(0, -(suffix.length + 1));
};

/**
 * Derives a valid custom element selector from a kebab-case component name.
 * Names without a hyphen (or that collide with reserved names) are prefixed
 * with "app-" so `melodic g component card` yields the usable "app-card".
 */
export const toSelector = (kebabName: string): { selector: string; prefixed: boolean } => {
	if (kebabName.includes('-') && !RESERVED_SELECTORS.has(kebabName)) {
		return { selector: kebabName, prefixed: false };
	}
	return { selector: `app-${kebabName}`, prefixed: true };
};

/**
 * Guards against symlink escapes: `validateRelativePath` only inspects the
 * string, so `--path link/out` passes even when `link` points outside the
 * project. Resolves the deepest existing ancestor of `targetPath` and requires
 * it to be inside the (resolved) project root.
 */
export const assertInsideRoot = async (rootPath: string, targetPath: string, label: string): Promise<void> => {
	const realRoot = await fs.realpath(rootPath);
	let current = path.resolve(targetPath);
	let realCurrent: string | undefined;
	while (realCurrent === undefined) {
		try {
			realCurrent = await fs.realpath(current);
		} catch {
			const parent = path.dirname(current);
			if (parent === current) {
				break;
			}
			current = parent;
		}
	}
	const relative = realCurrent === undefined ? '..' : path.relative(realRoot, realCurrent);
	if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
		throw new Error(`${label} resolves outside the project (${targetPath} -> ${realCurrent ?? 'unknown'}). Refusing to write through a symlink that leaves the project.`);
	}
};
