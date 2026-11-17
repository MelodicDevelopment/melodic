import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import '../../../src/components/forms/select/select.component';
import '../../../src/components/forms/autocomplete/autocomplete.component';
import { flush, createComponent, removeComponent, shadowQuery } from '../../helpers/component-test-utils';
import { installPopoverPolyfill } from '../../helpers/popover-polyfill';

/**
 * REGRESSION: ml-select and ml-autocomplete keep `value`, `values` and
 * `multiple` in step from onPropertyChange — which fires BEFORE the new value
 * commits. Both read the changing property off `this` (the OLD value), so:
 *   - turning `multiple` on ran the "turning off" branch and wiped `values`
 *   - turning it off left `value` stale and `values` populated
 *   - `value` writes in multiple mode added the PREVIOUS value
 *   - a comma-separated `values` string was never normalized
 * The logic is now shared (listbox-core) and driven by the hook's new value.
 */
const options = [
	{ value: 'a', label: 'Alpha' },
	{ value: 'b', label: 'Beta' },
	{ value: 'c', label: 'Charlie' }
];

describe.each(['ml-select', 'ml-autocomplete'])('%s value / values / multiple sync', (tag) => {
	let el: any;

	beforeAll(() => {
		installPopoverPolyfill();
	});

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('carries the single value into values when multiple turns on', async () => {
		el = createComponent(tag, { properties: { options, value: 'b' } });
		await flush();

		el.multiple = true;
		await flush();
		expect(el.values).toEqual(['b']);
	});

	it('keeps values that were set before multiple was turned on', async () => {
		el = createComponent(tag, { properties: { options } });
		el.values = ['a', 'b'];
		await flush();

		el.multiple = true;
		await flush();
		expect(el.values).toEqual(['a', 'b']);
	});

	it('keeps the first selection as the value when multiple turns off', async () => {
		el = createComponent(tag, { attributes: { multiple: '' }, properties: { options, values: ['a', 'c'] } });
		await flush();

		el.multiple = false;
		await flush();
		expect(el.value).toBe('a');
		expect(el.values).toEqual([]);
	});

	it('adds the NEW value to values in multiple mode', async () => {
		el = createComponent(tag, { attributes: { multiple: '' }, properties: { options } });
		await flush();

		el.value = 'a';
		await flush();
		expect(el.values).toEqual(['a']);

		el.value = 'b';
		await flush();
		expect(el.values).toEqual(['a', 'b']);
	});

	it('normalizes a comma-separated string and duplicates assigned to values', async () => {
		el = createComponent(tag, { attributes: { multiple: '' }, properties: { options } });
		await flush();

		el.values = 'a, c';
		await flush();
		expect(el.values).toEqual(['a', 'c']);

		el.values = ['b', 'b', 'a'];
		await flush();
		expect(el.values).toEqual(['b', 'a']);
	});

	it('mirrors values[0] onto value in single mode, and leaves value alone for an empty array', async () => {
		el = createComponent(tag, { properties: { options } });
		await flush();

		el.values = ['c'];
		await flush();
		expect(el.value).toBe('c');

		el.values = [];
		await flush();
		expect(el.value).toBe('c');
	});

	it('the documented `multiple` + `.values` usage still selects both', async () => {
		el = createComponent(tag, { attributes: { multiple: '' }, properties: { options, values: ['a', 'b'] } });
		await flush();
		expect(el.values).toEqual(['a', 'b']);
		expect(el.component.selectedOptions.map((o: any) => o.value)).toEqual(['a', 'b']);
	});
});

describe('ml-select described-by / invalid / required', () => {
	let el: any;

	beforeAll(() => {
		installPopoverPolyfill();
	});

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('ties the hint, then the error, to the combobox', async () => {
		el = createComponent('ml-select', { attributes: { label: 'Country', hint: 'Pick one', required: '' }, properties: { options } });
		await flush();

		const trigger = shadowQuery<HTMLElement>(el, '.ml-select__trigger')!;
		const hint = shadowQuery<HTMLElement>(el, '.ml-select__hint')!;
		expect(hint.id).not.toBe('');
		expect(trigger.getAttribute('aria-describedby')).toBe(hint.id);
		expect(trigger.getAttribute('aria-required')).toBe('true');
		expect(trigger.hasAttribute('aria-invalid')).toBe(false);

		el.error = 'Required';
		await flush();
		const error = shadowQuery<HTMLElement>(el, '.ml-select__error')!;
		expect(trigger.getAttribute('aria-describedby')).toBe(error.id);
		expect(trigger.getAttribute('aria-invalid')).toBe('true');
	});

	it('makes the search input the combobox in multiple mode', async () => {
		el = createComponent('ml-select', { attributes: { label: 'Countries', multiple: '', hint: 'Any' }, properties: { options } });
		await flush();

		const trigger = shadowQuery<HTMLElement>(el, '.ml-select__trigger')!;
		const search = shadowQuery<HTMLInputElement>(el, '.ml-select__search')!;

		// One combobox, one tab stop — not a focusable input nested inside a
		// focusable role="combobox" wrapper.
		expect(trigger.hasAttribute('role')).toBe(false);
		expect(trigger.hasAttribute('tabindex')).toBe(false);
		expect(search.getAttribute('role')).toBe('combobox');
		expect(search.getAttribute('aria-controls')).toBe(el.component.listboxId);
		expect(search.getAttribute('aria-labelledby')).toBe(el.component.labelId);
		expect(search.getAttribute('aria-describedby')).toBe(shadowQuery<HTMLElement>(el, '.ml-select__hint')!.id);
		expect(search.getAttribute('aria-expanded')).toBe('false');

		trigger.click();
		await flush();
		expect(search.getAttribute('aria-expanded')).toBe('true');
		// The active option is announced from the element that has focus.
		expect(search.getAttribute('aria-activedescendant')).toBe(el.component.optionId(0));
	});

	it('keeps the trigger as the combobox in single mode', async () => {
		el = createComponent('ml-select', { properties: { options } });
		await flush();
		const trigger = shadowQuery<HTMLElement>(el, '.ml-select__trigger')!;
		expect(trigger.getAttribute('role')).toBe('combobox');
		expect(trigger.getAttribute('tabindex')).toBe('0');
	});
});

describe('ml-autocomplete keyboard and description', () => {
	let el: any;

	beforeAll(() => {
		installPopoverPolyfill();
	});

	afterEach(() => {
		if (el) removeComponent(el);
		vi.restoreAllMocks();
	});

	it('scrolls the active option into view when arrowing through the list', async () => {
		el = createComponent('ml-autocomplete', { properties: { options } });
		await flush();
		el.component.open();
		await flush();

		const scrolled: string[] = [];
		vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(function (this: Element) {
			scrolled.push(this.id);
		});

		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
		await flush();
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
		await flush();

		expect(scrolled).toEqual([el.component.optionId(1), el.component.optionId(0)]);
	});

	it('ties the hint / error to the input', async () => {
		el = createComponent('ml-autocomplete', { attributes: { hint: 'Type a name', required: '' }, properties: { options } });
		await flush();

		const input = shadowQuery<HTMLInputElement>(el, '.ml-autocomplete__input')!;
		expect(input.getAttribute('aria-describedby')).toBe(shadowQuery<HTMLElement>(el, '.ml-autocomplete__hint')!.id);
		expect(input.getAttribute('aria-required')).toBe('true');

		el.error = 'Nope';
		await flush();
		expect(input.getAttribute('aria-describedby')).toBe(shadowQuery<HTMLElement>(el, '.ml-autocomplete__error')!.id);
		expect(input.getAttribute('aria-invalid')).toBe('true');
	});
});
