import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/forms/checkbox/checkbox.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

describe('ml-checkbox', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders a checkbox input', () => {
		el = createComponent('ml-checkbox', { attributes: { label: 'Accept' } });
		expect(shadowQuery(el, 'input[type="checkbox"]')).toBeTruthy();
	});

	describe('error state (forms auto-population contract)', () => {
		it('renders the error message from the error attribute', async () => {
			el = createComponent('ml-checkbox', { attributes: { label: 'Accept', error: 'You must accept the terms' } });
			await flush();

			expect(shadowQuery(el, '.ml-checkbox__error')?.textContent?.trim()).toBe('You must accept the terms');
			expect(shadowHasClass(el, '.ml-checkbox', 'ml-checkbox--error')).toBe(true);
		});

		it('reacts to the error attribute being set later (validator contract)', async () => {
			el = createComponent('ml-checkbox', { attributes: { label: 'Accept' } });
			await flush();
			expect(shadowQuery(el, '.ml-checkbox__error')).toBeNull();

			// The forms system sets/removes the `error` attribute on touched+invalid
			el.setAttribute('error', 'Required');
			await flush();
			expect(shadowQuery(el, '.ml-checkbox__error')?.textContent?.trim()).toBe('Required');
			expect(shadowQuery<HTMLInputElement>(el, 'input')!.getAttribute('aria-invalid')).toBe('true');

			el.removeAttribute('error');
			await flush();
			expect(shadowQuery(el, '.ml-checkbox__error')).toBeNull();
			expect(shadowHasClass(el, '.ml-checkbox', 'ml-checkbox--error')).toBe(false);
		});

		it('shows the error instead of the hint, and restores the hint when cleared', async () => {
			el = createComponent('ml-checkbox', { attributes: { label: 'Accept', hint: 'Optional hint' } });
			await flush();
			expect(shadowQuery(el, '.ml-checkbox__hint')?.textContent?.trim()).toBe('Optional hint');

			el.setAttribute('error', 'Required');
			await flush();
			expect(shadowQuery(el, '.ml-checkbox__error')).toBeTruthy();
			expect(shadowQuery(el, '.ml-checkbox__hint')).toBeNull();

			el.removeAttribute('error');
			await flush();
			expect(shadowQuery(el, '.ml-checkbox__hint')?.textContent?.trim()).toBe('Optional hint');
		});
	});
});
