import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/data-display/badge/badge.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

describe('ml-badge', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders a badge element', () => {
		el = createComponent('ml-badge');
		expect(shadowQuery(el, '.ml-badge')).toBeTruthy();
	});

	it('applies variant class', async () => {
		el = createComponent('ml-badge', { properties: { variant: 'success' } });
		await flush();
		expect(shadowHasClass(el, '.ml-badge', 'ml-badge--success')).toBe(true);
	});

	it('applies size class', async () => {
		el = createComponent('ml-badge', { properties: { size: 'lg' } });
		await flush();
		expect(shadowHasClass(el, '.ml-badge', 'ml-badge--lg')).toBe(true);
	});

	it('applies pill class', async () => {
		el = createComponent('ml-badge', { properties: { pill: true } });
		await flush();
		expect(shadowHasClass(el, '.ml-badge', 'ml-badge--pill')).toBe(true);
	});

	it('renders dot when dot is true', async () => {
		el = createComponent('ml-badge', { properties: { dot: true } });
		await flush();
		expect(shadowQuery(el, '.ml-badge__dot')).toBeTruthy();
	});

	it('does not render dot by default', () => {
		el = createComponent('ml-badge');
		expect(shadowQuery(el, '.ml-badge__dot')).toBeNull();
	});

	it('applies custom color via color prop', async () => {
		el = createComponent('ml-badge', { properties: { color: '#c9a84c' } });
		await flush();
		expect(shadowHasClass(el, '.ml-badge', 'ml-badge--custom')).toBe(true);
		// Should NOT have a variant class when custom color is set
		expect(shadowHasClass(el, '.ml-badge', 'ml-badge--default')).toBe(false);
	});

	it('sets --ml-badge-bg CSS variable when color is set', async () => {
		el = createComponent('ml-badge', { properties: { color: '#ff0000' } });
		await flush();
		const badge = shadowQuery<HTMLElement>(el, '.ml-badge');
		expect(badge?.style.getPropertyValue('--ml-badge-bg')).toBe('#ff0000');
	});

	it('uses variant class when no custom color', async () => {
		el = createComponent('ml-badge', { properties: { variant: 'warning' } });
		await flush();
		expect(shadowHasClass(el, '.ml-badge', 'ml-badge--warning')).toBe(true);
		expect(shadowHasClass(el, '.ml-badge', 'ml-badge--custom')).toBe(false);
	});
});
