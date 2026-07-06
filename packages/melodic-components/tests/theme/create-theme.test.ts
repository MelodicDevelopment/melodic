import { describe, it, expect, afterEach } from 'vitest';
import { createTheme, injectTheme, createBrandTheme } from '../../src/theme/functions/create-theme.function';

describe('createTheme', () => {
	it('builds a scoped CSS block from overrides', () => {
		const css = createTheme('brand', {
			'--ml-color-primary': '#7c3aed',
			'--ml-color-primary-hover': 'color-mix(in srgb, #7c3aed, black 12%)'
		});

		expect(css).toContain('[data-theme="brand"]');
		expect(css).toContain('--ml-color-primary: #7c3aed;');
		expect(css).toContain('--ml-color-primary-hover: color-mix(in srgb, #7c3aed, black 12%);');
	});

	it('accepts names with digits and hyphens', () => {
		expect(() => createTheme('brand-2', {})).not.toThrow();
	});

	describe('theme name validation', () => {
		it.each([
			'evil"]{}',
			'brand"] body { display: none } [x="',
			'Brand',
			'my theme',
			'theme;',
			'',
			'a/b'
		])('rejects unsafe or malformed name %j', (name) => {
			expect(() => createTheme(name, {})).toThrow(/Invalid theme name/);
		});

		it('prevents selector breakout via the name', () => {
			expect(() => createTheme('x"] * { display: none } [data-theme="x', {})).toThrow();
		});
	});

	describe('override validation', () => {
		it('rejects keys that are not CSS custom properties', () => {
			expect(() => createTheme('brand', { color: 'red' })).toThrow(/Invalid theme token/);
			expect(() => createTheme('brand', { '--bad key': 'red' })).toThrow(/Invalid theme token/);
			expect(() => createTheme('brand', { '--x;}body{': 'red' })).toThrow(/Invalid theme token/);
		});

		it.each([
			'red; } body { display: none; } [data-theme="x"] {',
			'red}',
			'{red',
			'red;',
			'</style><script>alert(1)</script>',
			'red\nbackground: blue'
		])('rejects value breakout attempt %j', (value) => {
			expect(() => createTheme('brand', { '--ml-color-primary': value })).toThrow(/Invalid value/);
		});

		it('allows normal CSS values (functions, spaces, commas, percentages)', () => {
			expect(() =>
				createTheme('brand', {
					'--ml-color-primary': 'rgb(124, 58, 237)',
					'--ml-color-primary-subtle': 'color-mix(in srgb, #7c3aed, white 88%)',
					'--ml-font-sans': "'Inter', -apple-system, sans-serif",
					'--ml-space-4': '1rem'
				})
			).not.toThrow();
		});
	});
});

describe('injectTheme', () => {
	afterEach(() => {
		document.getElementById('ml-theme-brand')?.remove();
	});

	it('injects a style element with the theme CSS', () => {
		const style = injectTheme('brand', { '--ml-color-primary': '#7c3aed' });
		expect(style.id).toBe('ml-theme-brand');
		expect(document.head.contains(style)).toBe(true);
		expect(style.textContent).toContain('[data-theme="brand"]');
	});

	it('throws before injecting anything when the name is unsafe', () => {
		expect(() => injectTheme('x"]{}', { '--ml-color-primary': 'red' })).toThrow(/Invalid theme name/);
		expect(document.querySelectorAll('style[id^="ml-theme-"]').length).toBe(0);
	});
});

describe('createBrandTheme', () => {
	it('generates hover/active/subtle variants for light mode by default', () => {
		const css = createBrandTheme('brand', { primary: '#7c3aed' });

		expect(css).toContain('--ml-color-primary: #7c3aed;');
		expect(css).toContain('--ml-color-primary-hover: color-mix(in srgb, #7c3aed, black 12%);');
		expect(css).toContain('--ml-color-primary-active: color-mix(in srgb, #7c3aed, black 22%);');
		expect(css).toContain('--ml-color-primary-subtle: color-mix(in srgb, #7c3aed, white 88%);');
	});

	it('generates dark-mode variants when mode is "dark"', () => {
		const css = createBrandTheme('brand-dark', { primary: '#7c3aed', mode: 'dark' });

		expect(css).toContain('[data-theme="brand-dark"]');
		expect(css).toContain('--ml-color-primary: #7c3aed;');
		// Interaction states lighten instead of darken
		expect(css).toContain('--ml-color-primary-hover: color-mix(in srgb, #7c3aed, white 12%);');
		expect(css).toContain('--ml-color-primary-active: color-mix(in srgb, #7c3aed, white 22%);');
		// Subtle mixes toward black so it sits on dark surfaces
		expect(css).toContain('--ml-color-primary-subtle: color-mix(in srgb, #7c3aed, black 88%);');
	});

	it('applies the mode to every provided semantic color', () => {
		const css = createBrandTheme('brand-dark', { primary: '#7c3aed', danger: '#ef4444', mode: 'dark' });
		expect(css).toContain('--ml-color-danger-subtle: color-mix(in srgb, #ef4444, black 88%);');
		expect(css).toContain('--ml-color-danger-hover: color-mix(in srgb, #ef4444, white 12%);');
	});

	it('still validates the theme name', () => {
		expect(() => createBrandTheme('bad name', { primary: 'red' })).toThrow(/Invalid theme name/);
	});
});
