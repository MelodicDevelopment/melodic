import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/forms/button-group/button-group.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

describe('ml-button-group', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	describe('error state (forms auto-population contract)', () => {
		it('renders the error message from the error attribute', async () => {
			el = createComponent('ml-button-group', { attributes: { error: 'Pick at least one' } });
			await flush();

			expect(shadowQuery(el, '.ml-button-group__error')?.textContent?.trim()).toBe('Pick at least one');
			expect(shadowHasClass(el, '.ml-button-group', 'ml-button-group--error')).toBe(true);
		});

		it('reacts to the error attribute being set and cleared', async () => {
			el = createComponent('ml-button-group');
			await flush();
			expect(shadowQuery(el, '.ml-button-group__error')).toBeNull();

			el.setAttribute('error', 'Required');
			await flush();
			expect(shadowQuery(el, '.ml-button-group__error')?.textContent?.trim()).toBe('Required');

			el.removeAttribute('error');
			await flush();
			expect(shadowQuery(el, '.ml-button-group__error')).toBeNull();
			expect(shadowHasClass(el, '.ml-button-group', 'ml-button-group--error')).toBe(false);
		});
	});
});
