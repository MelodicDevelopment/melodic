import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import '../../../src/components/forms/select/select.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	captureEvent
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

	describe('typeahead', () => {
		const states = [
			{ value: 'al', label: 'Alabama' },
			{ value: 'me', label: 'Maine' },
			{ value: 'md', label: 'Maryland' },
			{ value: 'mi', label: 'Michigan' },
			{ value: 'mn', label: 'Minnesota' },
			{ value: 'oh', label: 'Ohio' }
		];

		const press = (key: string): void => {
			el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
		};

		afterEach(() => {
			vi.useRealTimers();
		});

		it('jumps focus to the first matching option while open', async () => {
			el = createComponent('ml-select', { properties: { options: states } });
			await flush();
			el.component.open();
			await flush();
			expect(el.focusedIndex).toBe(0); // Alabama

			press('m');
			await flush();
			expect(el.focusedIndex).toBe(1); // Maine
		});

		it('accumulates the buffer so "mi" matches Michigan, not Maine', async () => {
			el = createComponent('ml-select', { properties: { options: states } });
			await flush();
			el.component.open();
			await flush();

			press('m');
			press('i');
			await flush();
			expect(el.focusedIndex).toBe(3); // Michigan
		});

		it('resets the buffer after the typeahead timeout', async () => {
			vi.useFakeTimers({ now: Date.now() });
			el = createComponent('ml-select', { properties: { options: states } });
			await flush();
			el.component.open();
			await flush();

			press('m');
			await flush();
			expect(el.focusedIndex).toBe(1); // Maine

			vi.advanceTimersByTime(800);
			press('o');
			await flush();
			// A stale "mo" buffer would match nothing; a fresh "o" jumps to Ohio
			expect(el.focusedIndex).toBe(5);
		});

		it('cycles through matches on repeated presses of the same letter', async () => {
			el = createComponent('ml-select', { properties: { options: states } });
			await flush();
			el.component.open();
			await flush();

			press('m');
			await flush();
			expect(el.focusedIndex).toBe(1); // Maine

			press('m');
			await flush();
			expect(el.focusedIndex).toBe(2); // Maryland

			press('m');
			press('m');
			press('m');
			await flush();
			expect(el.focusedIndex).toBe(1); // Michigan → Minnesota → wraps to Maine
		});

		it('skips disabled options', async () => {
			el = createComponent('ml-select', {
				properties: {
					options: [
						{ value: 'al', label: 'Alabama' },
						{ value: 'me', label: 'Maine', disabled: true },
						{ value: 'md', label: 'Maryland' }
					]
				}
			});
			await flush();
			el.component.open();
			await flush();

			press('m');
			await flush();
			expect(el.focusedIndex).toBe(2); // Maryland — Maine is disabled
		});

		it('selects the match directly and emits ml:change while closed', async () => {
			el = createComponent('ml-select', { properties: { options: states } });
			await flush();

			const changed = captureEvent<{ value: string }>(el, 'ml:change');
			press('m');
			const event = await changed;

			expect(event.detail.value).toBe('me'); // Maine
			expect(el.value).toBe('me');
			expect(el.isOpen).toBe(false);
		});

		it('moves focus without toggling values in multiple mode', async () => {
			el = createComponent('ml-select', {
				attributes: { multiple: '' },
				properties: { options: states }
			});
			await flush();
			el.component.open();
			await flush();

			press('m');
			await flush();
			expect(el.focusedIndex).toBe(1); // Maine
			expect(el.values).toEqual([]);
		});
	});
});
