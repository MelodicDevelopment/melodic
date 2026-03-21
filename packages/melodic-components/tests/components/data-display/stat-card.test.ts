import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/data-display/stat-card/stat-card.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

describe('ml-stat-card', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders the card container', () => {
		el = createComponent('ml-stat-card');
		expect(shadowQuery(el, '.ml-stat-card')).toBeTruthy();
	});

	it('displays label text', async () => {
		el = createComponent('ml-stat-card', { properties: { label: 'Total Members' } });
		await flush();
		const label = shadowQuery(el, '.ml-stat-card__label');
		expect(label?.textContent).toBe('Total Members');
	});

	it('displays value text', async () => {
		el = createComponent('ml-stat-card', { properties: { value: '1,247' } });
		await flush();
		const value = shadowQuery(el, '.ml-stat-card__value');
		expect(value?.textContent).toBe('1,247');
	});

	it('defaults to serif value font', async () => {
		el = createComponent('ml-stat-card', { properties: { value: '100' } });
		await flush();
		expect(shadowHasClass(el, '.ml-stat-card__value', 'ml-stat-card__value--serif')).toBe(true);
	});

	it('applies sans value font', async () => {
		el = createComponent('ml-stat-card', { properties: { 'value-font': 'sans' } });
		await flush();
		expect(shadowHasClass(el, '.ml-stat-card__value', 'ml-stat-card__value--sans')).toBe(true);
	});

	it('renders trend text when provided', async () => {
		el = createComponent('ml-stat-card', { properties: { trend: '+6 this month' } });
		await flush();
		const trend = shadowQuery(el, '.ml-stat-card__trend');
		expect(trend?.textContent).toBe('+6 this month');
	});

	it('does not render trend when empty', () => {
		el = createComponent('ml-stat-card');
		expect(shadowQuery(el, '.ml-stat-card__trend')).toBeNull();
	});

	it('applies trend direction class', async () => {
		el = createComponent('ml-stat-card', {
			properties: { trend: '+6', 'trend-direction': 'up' }
		});
		await flush();
		expect(shadowHasClass(el, '.ml-stat-card__trend', 'ml-stat-card__trend--up')).toBe(true);
	});

	it('renders icon when provided', async () => {
		el = createComponent('ml-stat-card', { properties: { icon: 'users' } });
		await flush();
		const icon = shadowQuery(el, '.ml-stat-card__icon');
		expect(icon).toBeTruthy();
		expect(shadowQuery(el, 'ml-icon')).toBeTruthy();
	});

	it('does not render icon when empty', () => {
		el = createComponent('ml-stat-card');
		expect(shadowQuery(el, '.ml-stat-card__icon')).toBeNull();
	});

	it('applies custom icon color via style', async () => {
		el = createComponent('ml-stat-card', {
			properties: { icon: 'users', 'icon-color': '#c9a84c' }
		});
		await flush();
		const icon = shadowQuery<HTMLElement>(el, '.ml-stat-card__icon');
		expect(icon?.style.getPropertyValue('--ml-stat-card-icon-color')).toBe('#c9a84c');
	});
});
