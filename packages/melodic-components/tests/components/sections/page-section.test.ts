import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/sections/page-section/page-section.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

describe('ml-page-section', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders the section container', () => {
		el = createComponent('ml-page-section');
		expect(shadowQuery(el, '.ml-page-section')).toBeTruthy();
	});

	it('renders title when provided', async () => {
		el = createComponent('ml-page-section', { properties: { title: 'Recent Activity' } });
		await flush();
		const title = shadowQuery(el, '.ml-page-section__title');
		expect(title?.textContent).toBe('Recent Activity');
	});

	it('does not render header when no title', () => {
		el = createComponent('ml-page-section');
		expect(shadowQuery(el, '.ml-page-section__header')).toBeNull();
	});

	it('renders subtitle when provided', async () => {
		el = createComponent('ml-page-section', {
			properties: { title: 'Activity', subtitle: 'Last 7 days' }
		});
		await flush();
		const subtitle = shadowQuery(el, '.ml-page-section__subtitle');
		expect(subtitle?.textContent).toBe('Last 7 days');
	});

	it('renders action link when action-label is set', async () => {
		el = createComponent('ml-page-section', {
			properties: { title: 'Members', 'action-label': 'View All', 'action-href': '/members' }
		});
		await flush();
		const link = shadowQuery<HTMLAnchorElement>(el, '.ml-page-section__action-link');
		expect(link?.textContent).toBe('View All');
		expect(link?.getAttribute('href')).toBe('/members');
	});

	it('defaults to md padding', () => {
		el = createComponent('ml-page-section');
		expect(shadowHasClass(el, '.ml-page-section', 'ml-page-section--pad-md')).toBe(true);
	});

	it('applies padding variant', async () => {
		el = createComponent('ml-page-section', { properties: { padding: 'lg' } });
		await flush();
		expect(shadowHasClass(el, '.ml-page-section', 'ml-page-section--pad-lg')).toBe(true);
	});

	it('renders content slot', () => {
		el = createComponent('ml-page-section');
		expect(shadowQuery(el, '.ml-page-section__content')).toBeTruthy();
		expect(shadowQuery(el, '.ml-page-section__content slot:not([name])')).toBeTruthy();
	});
});
