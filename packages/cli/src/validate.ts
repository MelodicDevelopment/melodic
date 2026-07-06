import path from 'node:path';
import { toKebabCase } from './utils.js';

/** Valid kebab-case identifier for anything the CLI names or interpolates into source. */
export const NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

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
		throw new Error(`${label} "${raw}" is invalid. Use lowercase letters, digits and hyphens, starting with a letter (e.g. "user-card").`);
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
