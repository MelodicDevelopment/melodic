import { describe, it, expect } from 'vitest';
import { createTheme, createBrandTheme } from '../../packages/melodic-components/src/theme/functions/create-theme.function';
import { darkThemeCss } from '../../packages/melodic-components/src/theme/presets/dark.preset';

describe('theme system', () => {
	it('createTheme wraps overrides in a [data-theme] selector', () => {
		const css = createTheme('brand', { '--ml-color-primary': '#7c3aed' });
		expect(css).toContain('[data-theme="brand"]');
		expect(css).toContain('--ml-color-primary: #7c3aed;');
	});

	it('createBrandTheme generates hover/active/subtle variants for each color', () => {
		const css = createBrandTheme('brand', { primary: '#7c3aed' });
		expect(css).toContain('--ml-color-primary: #7c3aed;');
		// Interaction-state variants must be derived, not left at the default blue.
		expect(css).toContain('--ml-color-primary-hover:');
		expect(css).toContain('--ml-color-primary-active:');
		expect(css).toContain('--ml-color-primary-subtle:');
		expect(css).toMatch(/color-mix\(in srgb, #7c3aed/);
	});

	it('system dark mode only applies when no explicit theme is set', () => {
		// Regression: `:root:not([data-theme="light"])` also matched custom themes
		// like data-theme="brand", layering dark tokens onto them under OS dark.
		expect(darkThemeCss).toContain(':root:not([data-theme])');
		expect(darkThemeCss).not.toContain(':root:not([data-theme="light"])');
	});
});
