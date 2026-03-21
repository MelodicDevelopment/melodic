import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/data-display/avatar/avatar.component';
import '../../../src/components/data-display/activity-feed/activity-feed-item.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

describe('ml-activity-feed-item', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders the feed item', () => {
		el = createComponent('ml-activity-feed-item');
		expect(shadowQuery(el, '.ml-afi')).toBeTruthy();
	});

	it('displays name', async () => {
		el = createComponent('ml-activity-feed-item', { properties: { name: 'Jane Doe' } });
		await flush();
		const name = shadowQuery(el, '.ml-afi__name');
		expect(name?.textContent).toBe('Jane Doe');
	});

	it('displays timestamp', async () => {
		el = createComponent('ml-activity-feed-item', { properties: { timestamp: '2 hours ago' } });
		await flush();
		const ts = shadowQuery(el, '.ml-afi__timestamp');
		expect(ts?.textContent).toBe('2 hours ago');
	});

	it('renders indicator when indicator is true', async () => {
		el = createComponent('ml-activity-feed-item', { properties: { indicator: true } });
		await flush();
		expect(shadowQuery(el, '.ml-afi__indicator')).toBeTruthy();
	});

	it('does not render indicator by default', () => {
		el = createComponent('ml-activity-feed-item');
		expect(shadowQuery(el, '.ml-afi__indicator')).toBeNull();
	});

	it('applies preset indicator color class', async () => {
		el = createComponent('ml-activity-feed-item', {
			properties: { indicator: true, 'indicator-color': 'success' }
		});
		await flush();
		expect(shadowHasClass(el, '.ml-afi__indicator', 'ml-afi__indicator--success')).toBe(true);
	});

	it('applies custom indicator color via CSS variable', async () => {
		el = createComponent('ml-activity-feed-item', {
			properties: { indicator: true, 'indicator-color': '#c9a84c' }
		});
		await flush();
		const dot = shadowQuery<HTMLElement>(el, '.ml-afi__indicator');
		expect(dot?.style.getPropertyValue('--ml-afi-indicator-bg')).toBe('#c9a84c');
		// Should NOT have a preset class
		expect(shadowHasClass(el, '.ml-afi__indicator', 'ml-afi__indicator--#c9a84c')).toBe(false);
	});

	it('treats preset names as presets, not custom colors', async () => {
		el = createComponent('ml-activity-feed-item', {
			properties: { indicator: true, 'indicator-color': 'warning' }
		});
		await flush();
		const dot = shadowQuery<HTMLElement>(el, '.ml-afi__indicator');
		expect(shadowHasClass(el, '.ml-afi__indicator', 'ml-afi__indicator--warning')).toBe(true);
		// Should NOT have inline custom color
		expect(dot?.style.getPropertyValue('--ml-afi-indicator-bg')).toBe('');
	});
});
