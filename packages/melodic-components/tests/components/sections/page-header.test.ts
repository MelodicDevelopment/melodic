import { describe, it, expect, afterEach, vi } from 'vitest';
import '../../../src/components/sections/page-header/page-header.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

/** Wait for slotchange (fires on a task) plus one render microtask. */
async function settle(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 20));
	await flush();
}

describe('ml-page-header', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	it('renders the header container', () => {
		el = createComponent('ml-page-header');
		expect(shadowQuery(el, '.ml-page-header')).toBeTruthy();
	});

	it('renders the title from the header-title attribute', async () => {
		el = createComponent('ml-page-header', { attributes: { 'header-title': 'Dashboard' } });
		await flush();
		expect(shadowQuery(el, '.ml-page-header__title h1')?.textContent).toBe('Dashboard');
	});

	it('maps the deprecated title attribute to headerTitle', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			el = createComponent('ml-page-header', { attributes: { title: 'Legacy' } });
			await flush();
			expect(el.headerTitle).toBe('Legacy');
			expect(shadowQuery(el, '.ml-page-header__title h1')?.textContent).toBe('Legacy');
		} finally {
			warnSpy.mockRestore();
		}
	});

	it('renders the description', async () => {
		el = createComponent('ml-page-header', { attributes: { description: 'Overview' } });
		await flush();
		expect(shadowQuery(el, '.ml-page-header__description p')?.textContent).toBe('Overview');
	});

	it('always renders all named slots for content projection', () => {
		el = createComponent('ml-page-header');
		for (const name of ['breadcrumb', 'title', 'description', 'meta', 'actions', 'tabs']) {
			expect(shadowQuery(el, `slot[name="${name}"]`), `slot ${name}`).toBeTruthy();
		}
	});

	it('hides empty sections by default', () => {
		el = createComponent('ml-page-header');
		expect(shadowHasClass(el, '.ml-page-header__actions', 'ml-page-header__section--empty')).toBe(true);
		expect(shadowHasClass(el, '.ml-page-header__breadcrumb', 'ml-page-header__section--empty')).toBe(true);
		expect(shadowHasClass(el, '.ml-page-header__tabs', 'ml-page-header__section--empty')).toBe(true);
		expect(shadowHasClass(el, '.ml-page-header__meta', 'ml-page-header__section--empty')).toBe(true);
	});

	it('reveals the actions section when content is inserted after mount', async () => {
		el = createComponent('ml-page-header', { attributes: { 'header-title': 'T' } });
		await flush();
		expect(shadowHasClass(el, '.ml-page-header__actions', 'ml-page-header__section--empty')).toBe(true);

		const button = document.createElement('button');
		button.slot = 'actions';
		button.textContent = 'Create';
		el.appendChild(button);
		await settle();

		expect(el.hasActions).toBe(true);
		expect(shadowHasClass(el, '.ml-page-header__actions', 'ml-page-header__section--empty')).toBe(false);
	});

	it('hides the actions section again when content is removed', async () => {
		el = createComponent('ml-page-header');
		const button = document.createElement('button');
		button.slot = 'actions';
		el.appendChild(button);
		await settle();
		expect(el.hasActions).toBe(true);

		button.remove();
		await settle();
		expect(el.hasActions).toBe(false);
		expect(shadowHasClass(el, '.ml-page-header__actions', 'ml-page-header__section--empty')).toBe(true);
	});

	it('projects slotted title content inserted after mount', async () => {
		el = createComponent('ml-page-header');
		await flush();
		// No title attribute and no slot content: title section hidden
		expect(shadowHasClass(el, '.ml-page-header__title', 'ml-page-header__section--empty')).toBe(true);

		const heading = document.createElement('span');
		heading.slot = 'title';
		heading.textContent = 'Rich title';
		el.appendChild(heading);
		await settle();

		expect(el.hasTitleSlot).toBe(true);
		expect(shadowHasClass(el, '.ml-page-header__title', 'ml-page-header__section--empty')).toBe(false);
	});

	it('reveals breadcrumb, meta, and tabs sections reactively', async () => {
		el = createComponent('ml-page-header');
		for (const [slotName, prop, selector] of [
			['breadcrumb', 'hasBreadcrumb', '.ml-page-header__breadcrumb'],
			['meta', 'hasMeta', '.ml-page-header__meta'],
			['tabs', 'hasTabs', '.ml-page-header__tabs']
		] as const) {
			const child = document.createElement('div');
			child.slot = slotName;
			el.appendChild(child);
			await settle();
			expect(el[prop], prop).toBe(true);
			expect(shadowHasClass(el, selector, 'ml-page-header__section--empty')).toBe(false);
		}
	});

	it('applies the variant class', async () => {
		el = createComponent('ml-page-header', { attributes: { variant: 'compact' } });
		await flush();
		expect(shadowHasClass(el, '.ml-page-header', 'ml-page-header--compact')).toBe(true);
	});
});
