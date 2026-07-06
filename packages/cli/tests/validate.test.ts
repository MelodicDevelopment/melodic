import { describe, expect, it } from 'vitest';
import { stripTypeSuffix, toSelector, validateName, validateRelativePath } from '../src/validate.js';
import { stripJsonc, toCamelCase, toKebabCase, toPascalCase } from '../src/utils.js';

describe('validateName', () => {
	it('accepts and kebab-cases valid names', () => {
		expect(validateName('user-card', 'Name')).toBe('user-card');
		expect(validateName('UserCard', 'Name')).toBe('user-card');
		expect(validateName('user_card', 'Name')).toBe('user-card');
		expect(validateName('a', 'Name')).toBe('a');
		expect(validateName('v2-widget', 'Name')).toBe('v2-widget');
	});

	it('rejects path traversal', () => {
		expect(() => validateName('../../evil', 'Name')).toThrow(/path separators/);
		expect(() => validateName('..', 'Name')).toThrow(/path separators/);
		expect(() => validateName('foo/bar', 'Name')).toThrow(/path separators/);
		expect(() => validateName('foo\\bar', 'Name')).toThrow(/path separators/);
	});

	it('rejects quote/template breakout characters', () => {
		expect(() => validateName("o'brien", 'Name')).toThrow(/invalid/);
		expect(() => validateName('foo"bar', 'Name')).toThrow(/invalid/);
		expect(() => validateName('foo`bar', 'Name')).toThrow(/invalid/);
		expect(() => validateName('foo${x}', 'Name')).toThrow(/invalid/);
	});

	it('rejects names that do not start with a letter', () => {
		expect(() => validateName('9lives', 'Name')).toThrow(/invalid/);
		expect(() => validateName('-card', 'Name')).toThrow(/invalid/);
		expect(() => validateName('', 'Name')).toThrow(/required/);
	});
});

describe('validateRelativePath', () => {
	it('accepts relative project paths', () => {
		expect(validateRelativePath('src/components', '--path')).toBe('src/components');
		expect(validateRelativePath('apps/web/src', '--path')).toBe('apps/web/src');
	});

	it('rejects absolute paths and traversal', () => {
		expect(() => validateRelativePath('/tmp/evil', '--path')).toThrow(/relative path/);
		expect(() => validateRelativePath('C:\\evil', '--path')).toThrow(/relative path/);
		expect(() => validateRelativePath('../outside', '--path')).toThrow(/\.\./);
		expect(() => validateRelativePath('src/../../outside', '--path')).toThrow(/\.\./);
	});
});

describe('stripTypeSuffix', () => {
	it('dedupes the generator type suffix', () => {
		expect(stripTypeSuffix('user-card-component', 'component')).toBe('user-card');
		expect(stripTypeSuffix('auth-service', 'service')).toBe('auth');
		expect(stripTypeSuffix('user-card', 'component')).toBe('user-card');
	});

	it('keeps names that are only the suffix', () => {
		expect(stripTypeSuffix('component', 'component')).toBe('component');
	});
});

describe('toSelector', () => {
	it('keeps hyphenated names as-is', () => {
		expect(toSelector('user-card')).toEqual({ selector: 'user-card', prefixed: false });
	});

	it('prefixes single-word names with app-', () => {
		expect(toSelector('card')).toEqual({ selector: 'app-card', prefixed: true });
	});

	it('prefixes spec-reserved hyphenated names', () => {
		expect(toSelector('font-face')).toEqual({ selector: 'app-font-face', prefixed: true });
	});
});

describe('case helpers', () => {
	it('converts between cases', () => {
		expect(toKebabCase('UserCard')).toBe('user-card');
		expect(toPascalCase('user-card')).toBe('UserCard');
		expect(toCamelCase('auto-focus')).toBe('autoFocus');
	});
});

describe('stripJsonc', () => {
	it('strips comments and trailing commas but preserves strings', () => {
		const raw = `{
	// line comment
	"a": "value // not a comment",
	/* block
	   comment */
	"b": ["x", "y",],
	"c": "slash /* inside */ string",
}`;
		expect(JSON.parse(stripJsonc(raw))).toEqual({
			a: 'value // not a comment',
			b: ['x', 'y'],
			c: 'slash /* inside */ string'
		});
	});
});
