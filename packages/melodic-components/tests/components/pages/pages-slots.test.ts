import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/pages/auth/login-page.component';
import '../../../src/components/pages/auth/signup-page.component';
import '../../../src/components/pages/dashboard/dashboard-page.component';
import '../../../src/components/sections/app-shell/app-shell.component';
import '../../../src/components/sections/page-header/page-header.component';
import { flush, createComponent, removeComponent, shadowQuery } from '../../helpers/component-test-utils';

async function settle(): Promise<void> {
	await flush();
	await new Promise((r) => setTimeout(r, 0));
	await flush();
}

describe('auth pages header slot reactivity (native slot fallback)', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	for (const tag of ['ml-login-page', 'ml-signup-page']) {
		it(`${tag}: shows the default title, then projects header content added after mount`, async () => {
			el = createComponent(tag);
			await settle();

			// Fallback content renders while the slot is empty.
			const slot = shadowQuery<HTMLSlotElement>(el, 'slot[name="header"]');
			expect(slot).not.toBeNull();
			expect(slot!.assignedNodes()).toHaveLength(0);
			expect(shadowQuery(el, '.ml-auth__title')).not.toBeNull();

			// Content inserted AFTER mount must project (previously frozen by a
			// render-time querySelector snapshot inside when()).
			const header = document.createElement('div');
			header.slot = 'header';
			header.textContent = 'Custom header';
			el.appendChild(header);
			await settle();

			expect(slot!.assignedNodes()).toContain(header);
		});
	}
});

describe('ml-dashboard-page slot reactivity', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	it('projects metrics content added after mount', async () => {
		el = createComponent('ml-dashboard-page');
		await settle();

		expect(shadowQuery(el, '.ml-dashboard__metrics')).toBeNull();

		const metrics = document.createElement('div');
		metrics.slot = 'metrics';
		el.appendChild(metrics);
		await settle();

		const wrapper = shadowQuery(el, '.ml-dashboard__metrics');
		expect(wrapper).not.toBeNull();
		const slot = wrapper!.querySelector('slot[name="metrics"]') as HTMLSlotElement;
		expect(slot.assignedNodes()).toContain(metrics);
	});

	it('projects aside content added after mount (default layout)', async () => {
		el = createComponent('ml-dashboard-page');
		await settle();

		expect(shadowQuery(el, '.ml-dashboard__aside')).toBeNull();

		const aside = document.createElement('div');
		aside.slot = 'aside';
		el.appendChild(aside);
		await settle();

		const wrapper = shadowQuery(el, '.ml-dashboard__aside');
		expect(wrapper).not.toBeNull();
	});

	it('renders the header-actions slot chain when content is added after mount', async () => {
		el = createComponent('ml-dashboard-page');
		await settle();

		expect(shadowQuery(el, 'slot[name="header-actions"]')).toBeNull();

		const action = document.createElement('button');
		action.slot = 'header-actions';
		el.appendChild(action);
		await settle();

		expect(shadowQuery(el, 'slot[name="header-actions"]')).not.toBeNull();
	});

	it('hides the metrics wrapper again when the content is removed', async () => {
		el = createComponent('ml-dashboard-page');
		const metrics = document.createElement('div');
		metrics.slot = 'metrics';
		el.appendChild(metrics);
		await settle();
		expect(shadowQuery(el, '.ml-dashboard__metrics')).not.toBeNull();

		metrics.remove();
		await settle();
		expect(shadowQuery(el, '.ml-dashboard__metrics')).toBeNull();
	});
});
