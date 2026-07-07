import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/forms/toggle/toggle.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

describe('ml-toggle', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders a toggle input', () => {
		el = createComponent('ml-toggle', { attributes: { label: 'Notifications' } });
		expect(shadowQuery(el, 'input[type="checkbox"]')).toBeTruthy();
	});

	describe('error state (forms auto-population contract)', () => {
		it('renders the error message from the error attribute', async () => {
			el = createComponent('ml-toggle', { attributes: { label: 'Notifications', error: 'Must be enabled' } });
			await flush();

			expect(shadowQuery(el, '.ml-toggle__error')?.textContent?.trim()).toBe('Must be enabled');
			expect(shadowHasClass(el, '.ml-toggle', 'ml-toggle--error')).toBe(true);
		});

		it('reacts to the error attribute being set later (validator contract)', async () => {
			el = createComponent('ml-toggle', { attributes: { label: 'Notifications' } });
			await flush();
			expect(shadowQuery(el, '.ml-toggle__error')).toBeNull();

			el.setAttribute('error', 'Required');
			await flush();
			expect(shadowQuery(el, '.ml-toggle__error')?.textContent?.trim()).toBe('Required');
			expect(shadowQuery<HTMLInputElement>(el, 'input')!.getAttribute('aria-invalid')).toBe('true');

			el.removeAttribute('error');
			await flush();
			expect(shadowQuery(el, '.ml-toggle__error')).toBeNull();
			expect(shadowHasClass(el, '.ml-toggle', 'ml-toggle--error')).toBe(false);
		});

		it('shows the error instead of the hint, and restores the hint when cleared', async () => {
			el = createComponent('ml-toggle', { attributes: { label: 'Notifications', hint: 'Optional hint' } });
			await flush();
			expect(shadowQuery(el, '.ml-toggle__hint')?.textContent?.trim()).toBe('Optional hint');

			el.setAttribute('error', 'Required');
			await flush();
			expect(shadowQuery(el, '.ml-toggle__error')).toBeTruthy();
			expect(shadowQuery(el, '.ml-toggle__hint')).toBeNull();

			el.removeAttribute('error');
			await flush();
			expect(shadowQuery(el, '.ml-toggle__hint')?.textContent?.trim()).toBe('Optional hint');
		});
	});
});
