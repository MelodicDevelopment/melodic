import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import '../../../src/components/forms/select/select.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery
} from '../../helpers/component-test-utils';
import { installPopoverPolyfill } from '../../helpers/popover-polyfill';

describe('ml-select', () => {
	let el: any;

	beforeAll(() => {
		installPopoverPolyfill();
	});

	afterEach(() => {
		if (el) removeComponent(el);
	});

	const options = [
		{ value: 'a', label: 'Alpha' },
		{ value: 'b', label: 'Beta' },
		{ value: 'c', label: 'Charlie' }
	];

	describe('combobox ARIA', () => {
		it('links the trigger to a real label id via aria-labelledby', async () => {
			el = createComponent('ml-select', {
				attributes: { label: 'Country' },
				properties: { options }
			});
			await flush();

			const trigger = shadowQuery<HTMLElement>(el, '.ml-select__trigger')!;
			const label = shadowQuery<HTMLElement>(el, '.ml-select__label')!;

			expect(label.id).not.toBe('');
			expect(trigger.getAttribute('aria-labelledby')).toBe(label.id);
		});

		it('omits aria-labelledby entirely when there is no label', async () => {
			el = createComponent('ml-select', { properties: { options } });
			await flush();

			const trigger = shadowQuery<HTMLElement>(el, '.ml-select__trigger')!;
			// Must be absent — an empty-string attribute would reference nothing
			expect(trigger.hasAttribute('aria-labelledby')).toBe(false);
		});

		it('wires aria-controls to the listbox id', async () => {
			el = createComponent('ml-select', { properties: { options } });
			await flush();

			const trigger = shadowQuery<HTMLElement>(el, '.ml-select__trigger')!;
			const listbox = shadowQuery<HTMLElement>(el, '.ml-select__dropdown')!;

			expect(trigger.getAttribute('role')).toBe('combobox');
			expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
			expect(trigger.getAttribute('aria-expanded')).toBe('false');
			expect(listbox.id).not.toBe('');
			expect(trigger.getAttribute('aria-controls')).toBe(listbox.id);
		});

		it('tracks keyboard focus via aria-activedescendant while open', async () => {
			el = createComponent('ml-select', { properties: { options } });
			await flush();

			const trigger = shadowQuery<HTMLElement>(el, '.ml-select__trigger')!;
			expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);

			el.component.open();
			await flush();
			expect(trigger.getAttribute('aria-expanded')).toBe('true');

			const activeId = trigger.getAttribute('aria-activedescendant');
			expect(activeId).toBeTruthy();
			const active = el.shadowRoot!.getElementById(activeId!);
			expect(active).toBeTruthy();
			expect(active!.classList.contains('ml-select__option--focused')).toBe(true);

			// Arrow down moves the active descendant
			el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
			await flush();
			expect(trigger.getAttribute('aria-activedescendant')).not.toBe(activeId);

			el.component.close();
			await flush();
			expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
		});

		it('gives every option a unique id', async () => {
			el = createComponent('ml-select', { properties: { options } });
			await flush();
			el.component.open();
			await flush();

			const optionEls = Array.from(el.shadowRoot!.querySelectorAll('.ml-select__option')) as HTMLElement[];
			expect(optionEls.length).toBe(3);
			const ids = optionEls.map((o) => o.id);
			expect(new Set(ids).size).toBe(3);
			ids.forEach((id) => expect(id).not.toBe(''));
		});
	});

	describe('multiple mode trigger', () => {
		it('closes an open dropdown when the trigger is clicked', async () => {
			el = createComponent('ml-select', {
				attributes: { multiple: '' },
				properties: { options }
			});
			await flush();

			const trigger = shadowQuery<HTMLElement>(el, '.ml-select__trigger')!;

			trigger.click();
			await flush();
			expect(el.isOpen).toBe(true);

			trigger.click();
			await flush();
			expect(el.isOpen).toBe(false);
		});

		it('still opens from closed in multiple mode', async () => {
			el = createComponent('ml-select', {
				attributes: { multiple: '' },
				properties: { options }
			});
			await flush();

			const trigger = shadowQuery<HTMLElement>(el, '.ml-select__trigger')!;
			trigger.click();
			await flush();
			expect(el.isOpen).toBe(true);
		});
	});
});
