import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/data-display/avatar/avatar.component';
import '../../../src/components/data-display/profile-card/profile-card.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

describe('ml-profile-card', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders the profile card', () => {
		el = createComponent('ml-profile-card');
		expect(shadowQuery(el, '.ml-profile-card')).toBeTruthy();
	});

	it('renders the banner', () => {
		el = createComponent('ml-profile-card');
		expect(shadowQuery(el, '.ml-profile-card__banner')).toBeTruthy();
	});

	it('displays the name', async () => {
		el = createComponent('ml-profile-card', { properties: { name: 'Sarah Mitchell' } });
		await flush();
		const name = shadowQuery(el, '.ml-profile-card__name');
		expect(name?.textContent).toBe('Sarah Mitchell');
	});

	it('displays the subtitle', async () => {
		el = createComponent('ml-profile-card', { properties: { subtitle: 'Member · Choir' } });
		await flush();
		const sub = shadowQuery(el, '.ml-profile-card__subtitle');
		expect(sub?.textContent).toBe('Member · Choir');
	});

	it('does not render subtitle when empty', () => {
		el = createComponent('ml-profile-card', { properties: { name: 'Test' } });
		expect(shadowQuery(el, '.ml-profile-card__subtitle')).toBeNull();
	});

	it('derives initials from name', async () => {
		el = createComponent('ml-profile-card', { properties: { name: 'Sarah Mitchell' } });
		await flush();
		expect(el.initials).toBe('SM');
	});

	it('derives single initial from single name', async () => {
		el = createComponent('ml-profile-card', { properties: { name: 'Sarah' } });
		await flush();
		expect(el.initials).toBe('S');
	});

	it('caps initials at 2 characters', async () => {
		el = createComponent('ml-profile-card', { properties: { name: 'Sarah Jane Mitchell' } });
		await flush();
		expect(el.initials).toBe('SJ');
	});

	it('renders avatar component', async () => {
		el = createComponent('ml-profile-card', { properties: { name: 'Sarah Mitchell' } });
		await flush();
		expect(shadowQuery(el, 'ml-avatar')).toBeTruthy();
	});

	it('hides empty slot sections by default', () => {
		el = createComponent('ml-profile-card');
		expect(shadowHasClass(el, '.ml-profile-card__actions', 'ml-profile-card__section--hidden')).toBe(true);
	});

	it('always renders slot elements for content projection', () => {
		el = createComponent('ml-profile-card');
		expect(shadowQuery(el, 'slot[name="actions"]')).toBeTruthy();
		expect(shadowQuery(el, 'slot[name="details"]')).toBeTruthy();
		expect(shadowQuery(el, 'slot[name="tags"]')).toBeTruthy();
		expect(shadowQuery(el, 'slot[name="meta"]')).toBeTruthy();
	});
});
