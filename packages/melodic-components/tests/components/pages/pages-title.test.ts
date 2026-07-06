import { describe, it, expect, afterEach, vi } from 'vitest';
import '../../../src/components/pages/auth/login-page.component';
import '../../../src/components/pages/auth/signup-page.component';
import '../../../src/components/pages/dashboard/dashboard-page.component';
import '../../../src/components/sections/app-shell/app-shell.component';
import '../../../src/components/sections/page-header/page-header.component';
import { flush, createComponent, removeComponent, shadowQuery } from '../../helpers/component-test-utils';

describe('page components title migration', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	describe('ml-login-page', () => {
		it('renders the default page title', async () => {
			el = createComponent('ml-login-page');
			await flush();
			expect(shadowQuery(el, '.ml-auth__title')?.textContent).toBe('Log in to your account');
		});

		it('accepts the page-title attribute', async () => {
			el = createComponent('ml-login-page', { attributes: { 'page-title': 'Welcome back' } });
			await flush();
			expect(shadowQuery(el, '.ml-auth__title')?.textContent).toBe('Welcome back');
		});

		it('maps the deprecated title attribute to pageTitle', async () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				el = createComponent('ml-login-page', { attributes: { title: 'Legacy login' } });
				await flush();
				expect(shadowQuery(el, '.ml-auth__title')?.textContent).toBe('Legacy login');
				expect(el.pageTitle).toBe('Legacy login');
			} finally {
				warnSpy.mockRestore();
			}
		});
	});

	describe('ml-signup-page', () => {
		it('accepts the page-title attribute', async () => {
			el = createComponent('ml-signup-page', { attributes: { 'page-title': 'Join us' } });
			await flush();
			expect(shadowQuery(el, '.ml-auth__title')?.textContent).toBe('Join us');
		});

		it('maps the deprecated title property to pageTitle', async () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				el = createComponent('ml-signup-page', { properties: { title: 'Legacy signup' } });
				await flush();
				expect(el.pageTitle).toBe('Legacy signup');
				expect(shadowQuery(el, '.ml-auth__title')?.textContent).toBe('Legacy signup');
			} finally {
				warnSpy.mockRestore();
			}
		});
	});

	describe('ml-dashboard-page', () => {
		it('passes page-title through to the composed ml-page-header as header-title', async () => {
			el = createComponent('ml-dashboard-page', { attributes: { 'page-title': 'Overview' } });
			await flush();
			await flush();
			const header = shadowQuery<HTMLElement>(el, 'ml-page-header');
			expect(header).toBeTruthy();
			// The composed header must not carry the reserved global title attribute (native tooltip)
			expect(header!.hasAttribute('title')).toBe(false);
			expect(header!.getAttribute('header-title')).toBe('Overview');
		});

		it('maps the deprecated title attribute to pageTitle', async () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				el = createComponent('ml-dashboard-page', { attributes: { title: 'Legacy dash' } });
				await flush();
				expect(el.pageTitle).toBe('Legacy dash');
			} finally {
				warnSpy.mockRestore();
			}
		});
	});
});
