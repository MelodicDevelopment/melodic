import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/sections/app-shell/app-shell.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

describe('ml-app-shell', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders shell structure with sidebar, header, and content', () => {
		el = createComponent('ml-app-shell');
		expect(shadowQuery(el, '.ml-app-shell')).toBeTruthy();
		expect(shadowQuery(el, '.ml-app-shell__sidebar')).toBeTruthy();
		expect(shadowQuery(el, '.ml-app-shell__header')).toBeTruthy();
		expect(shadowQuery(el, '.ml-app-shell__content')).toBeTruthy();
	});

	it('applies sidebar-right class via property', async () => {
		el = createComponent('ml-app-shell');
		el['sidebar-position'] = 'right';
		await flush();
		expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--sidebar-right')).toBe(true);
	});

	it('applies sidebar-collapsed class via property', async () => {
		el = createComponent('ml-app-shell');
		el['sidebar-collapsed'] = true;
		await flush();
		expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--sidebar-collapsed')).toBe(true);
	});

	it('applies header-fixed class via property', async () => {
		el = createComponent('ml-app-shell');
		el['header-fixed'] = true;
		await flush();
		expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--header-fixed')).toBe(true);
	});

	// REGRESSION: mobileOpen property must trigger re-render and toggle class
	it('toggles ml-app-shell--mobile-open class when mobileOpen changes', async () => {
		el = createComponent('ml-app-shell');
		expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--mobile-open')).toBe(false);

		el.mobileOpen = true;
		await flush();
		expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--mobile-open')).toBe(true);

		el.mobileOpen = false;
		await flush();
		expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--mobile-open')).toBe(false);
	});

	// REGRESSION: mobile property controls hamburger button rendering
	it('renders hamburger button when mobile is true', async () => {
		el = createComponent('ml-app-shell');
		el.mobile = true;
		await flush();
		const menuBtn = shadowQuery(el, '.ml-app-shell__menu-btn');
		expect(menuBtn).toBeTruthy();
	});

	it('does not render hamburger button when mobile is false', async () => {
		el = createComponent('ml-app-shell');
		el.mobile = false;
		await flush();
		const menuBtn = shadowQuery(el, '.ml-app-shell__menu-btn');
		expect(menuBtn).toBeFalsy();
	});

	// REGRESSION: mobile property controls backdrop rendering
	it('renders backdrop when mobile is true', async () => {
		el = createComponent('ml-app-shell');
		el.mobile = true;
		await flush();
		const backdrop = shadowQuery(el, '.ml-app-shell__backdrop');
		expect(backdrop).toBeTruthy();
	});

	it('toggles mobileOpen via hamburger button click', async () => {
		el = createComponent('ml-app-shell');
		el.mobile = true;
		await flush();

		expect(el.mobileOpen).toBe(false);

		// Click hamburger to open
		const menuBtn = shadowQuery<HTMLButtonElement>(el, '.ml-app-shell__menu-btn')!;
		menuBtn.click();
		await flush();
		expect(el.mobileOpen).toBe(true);
		expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--mobile-open')).toBe(true);
	});

	it('closes mobile sidebar via backdrop click', async () => {
		el = createComponent('ml-app-shell');
		el.mobile = true;
		el.mobileOpen = true;
		await flush();

		const backdrop = shadowQuery<HTMLElement>(el, '.ml-app-shell__backdrop')!;
		backdrop.click();
		await flush();
		expect(el.mobileOpen).toBe(false);
		expect(shadowHasClass(el, '.ml-app-shell', 'ml-app-shell--mobile-open')).toBe(false);
	});
});
