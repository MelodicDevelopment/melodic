import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, flush, query, queryAll, unmountAll } from '../../src/testing';
import { setDevMode, resetDevWarnings } from '../../src/devtools/dev-mode';
import {
	setCrossRootDescription,
	setCrossRootLabel,
	setCrossRootActiveDescendant,
	clearCrossRootDescription,
	getFocusableControl
} from '../../packages/melodic-components/src/utils/accessibility/cross-root-aria.js';

import '../../packages/melodic-components/src/components/forms/form-field/index.js';
import '../../packages/melodic-components/src/components/forms/input/index.js';
import '../../packages/melodic-components/src/components/forms/textarea/index.js';
import '../../packages/melodic-components/src/components/forms/checkbox/index.js';
import '../../packages/melodic-components/src/components/forms/radio-card-group/index.js';
import '../../packages/melodic-components/src/components/data-display/table/index.js';
import '../../packages/melodic-components/src/components/navigation/steps/index.js';
import '../../packages/melodic-components/src/components/general/icon/index.js';

afterEach(async () => {
	await unmountAll();
	setDevMode(null);
	resetDevWarnings();
});

/**
 * The whole class of bug behind C2/C3/C9: an IDREF only resolves within the
 * tree it is written in, so a shadow-root element can never be referenced from
 * the light DOM by id.
 */
describe('cross-root ARIA helpers', () => {
	it('describes a target with an element from another root', () => {
		const target = document.createElement('button');
		const description = document.createElement('span');
		description.textContent = 'Saves your work';

		setCrossRootDescription(target, [description]);

		const reflected = target as HTMLElement & { ariaDescribedByElements?: Element[] | null };
		if ('ariaDescribedByElements' in reflected) {
			expect(reflected.ariaDescribedByElements).toEqual([description]);
		} else {
			// Fallback path: the TEXT is carried, because an IDREF could not resolve.
			expect(target.getAttribute('aria-description')).toBe('Saves your work');
		}
	});

	it('clears the relationship again', () => {
		const target = document.createElement('button');
		const description = document.createElement('span');
		description.textContent = 'Gone';

		setCrossRootDescription(target, [description]);
		clearCrossRootDescription(target);

		const reflected = target as HTMLElement & { ariaDescribedByElements?: Element[] | null };
		if ('ariaDescribedByElements' in reflected) {
			expect(reflected.ariaDescribedByElements).toBeNull();
		} else {
			expect(target.hasAttribute('aria-description')).toBe(false);
		}
	});

	it('labels and points at an active descendant across roots', () => {
		const target = document.createElement('div');
		const label = document.createElement('span');
		label.textContent = 'Choose a fruit';
		const option = document.createElement('li');
		option.id = 'opt-1';

		setCrossRootLabel(target, [label]);
		setCrossRootActiveDescendant(target, option);

		const reflected = target as HTMLElement & { ariaLabelledByElements?: Element[] | null; ariaActiveDescendantElement?: Element | null };
		expect('ariaLabelledByElements' in reflected ? reflected.ariaLabelledByElements : target.getAttribute('aria-label')).toBeTruthy();
		expect('ariaActiveDescendantElement' in reflected ? reflected.ariaActiveDescendantElement : target.getAttribute('aria-activedescendant')).toBeTruthy();
	});

	it('resolves the focusable control inside a composite element (C9)', () => {
		const host = document.createElement('div');
		const shadow = host.attachShadow({ mode: 'open' });
		const button = document.createElement('button');
		shadow.appendChild(button);

		expect(getFocusableControl(host)).toBe(button);

		// An element with no shadow control is its own focusable node.
		const plain = document.createElement('button');
		expect(getFocusableControl(plain)).toBe(plain);
	});
});

/** C2 — the label's `for` and the hint/error IDREFs never resolved. */
describe('ml-form-field', () => {
	it('focuses the slotted control when its label is clicked', async () => {
		const field = await mount('ml-form-field', {}, { attributes: { label: 'Email' } });
		field.innerHTML = '<input type="email" />';
		await flush();

		const input = field.querySelector('input')!;
		const focus = vi.spyOn(input, 'focus');

		query<HTMLLabelElement>(field, 'label')!.click();
		expect(focus).toHaveBeenCalled();
	});

	it('describes the control with the error element, across the boundary', async () => {
		const field = await mount('ml-form-field', {}, { attributes: { label: 'Email', error: 'Required' } });
		field.innerHTML = '<input type="email" />';
		await flush();

		const input = field.querySelector('input')! as HTMLInputElement & { ariaDescribedByElements?: Element[] | null };
		expect(input.getAttribute('aria-invalid')).toBe('true');

		if ('ariaDescribedByElements' in input) {
			expect(input.ariaDescribedByElements?.length).toBeGreaterThan(0);
		} else {
			expect(input.getAttribute('aria-description')).toContain('Required');
		}
	});

	it('clears disabled again, not only sets it', async () => {
		const field = await mount('ml-form-field', { disabled: true });
		field.innerHTML = '<input />';
		await flush();

		const input = field.querySelector('input')!;
		expect(input.disabled).toBe(true);

		(field as unknown as { disabled: boolean }).disabled = false;
		await flush();
		expect(input.disabled).toBe(false);
	});
});

/** C10 — an aria-label on the host named the custom element, not the input. */
describe('ml-input / ml-textarea accessible name', () => {
	it('names the inner input from the host aria-label', async () => {
		const input = await mount('ml-input', {}, { attributes: { 'aria-label': 'Search' } });
		await flush();

		expect(query(input, 'input')!.getAttribute('aria-label')).toBe('Search');
	});

	it('falls back to the placeholder', async () => {
		const input = await mount('ml-input', {}, { attributes: { placeholder: 'you@example.com' } });
		await flush();

		expect(query(input, 'input')!.getAttribute('aria-label')).toBe('you@example.com');
	});

	it('does not duplicate a visible label', async () => {
		const input = await mount('ml-input', {}, { attributes: { label: 'Email' } });
		await flush();

		expect(query(input, 'input')!.getAttribute('aria-label')).toBe('');
	});

	it('forwards the common native attributes', async () => {
		const input = await mount('ml-input', {}, { attributes: { name: 'email', maxlength: '20', pattern: '.+@.+', inputmode: 'email' } });
		await flush();

		const field = query<HTMLInputElement>(input, 'input')!;
		expect(field.getAttribute('name')).toBe('email');
		expect(field.getAttribute('maxlength')).toBe('20');
		expect(field.getAttribute('pattern')).toBe('.+@.+');
		expect(field.getAttribute('inputmode')).toBe('email');
	});

	it('names the inner textarea too', async () => {
		const textarea = await mount('ml-textarea', {}, { attributes: { 'aria-label': 'Notes', name: 'notes' } });
		await flush();

		const field = query<HTMLTextAreaElement>(textarea, 'textarea')!;
		expect(field.getAttribute('aria-label')).toBe('Notes');
		expect(field.getAttribute('name')).toBe('notes');
	});
});

/** ml-checkbox gained name/value so it can participate in a form. */
describe('ml-checkbox', () => {
	it('forwards name and value to the inner input', async () => {
		const checkbox = await mount('ml-checkbox', {}, { attributes: { name: 'terms', value: 'accepted' } });
		await flush();

		const input = query<HTMLInputElement>(checkbox, 'input')!;
		expect(input.getAttribute('name')).toBe('terms');
		expect(input.getAttribute('value')).toBe('accepted');
	});
});

/** C11 — sort headers were mouse-only. */
describe('ml-table keyboard sorting', () => {
	it('sorts on Enter and Space from a focused header', async () => {
		const table = await mount('ml-table', {
			columns: [{ key: 'name', label: 'Name', sortable: true }],
			rows: [{ name: 'b' }, { name: 'a' }]
		});
		await flush();

		const header = query<HTMLElement>(table, 'th.ml-table__th--sortable')!;
		expect(header.getAttribute('tabindex')).toBe('0');

		header.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		await flush();

		const cells = queryAll(table, 'tbody td').map((cell) => cell.textContent?.trim());
		expect(cells[0]).toBe('a');

		header.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
		await flush();
		expect(queryAll(table, 'tbody td')[0].textContent?.trim()).toBe('b');
	});

	it('leaves a non-sortable header out of the tab order', async () => {
		const table = await mount('ml-table', {
			columns: [{ key: 'name', label: 'Name' }],
			rows: [{ name: 'a' }]
		});
		await flush();

		expect(query<HTMLElement>(table, 'th')!.getAttribute('tabindex')).toBe('');
	});
});

/** C17 — every radio card was a tab stop; the group had no arrow keys. */
describe('ml-radio-card-group', () => {
	it('is a single tab stop and moves selection with the arrow keys', async () => {
		const group = await mount('ml-radio-card-group');
		group.innerHTML = `
			<ml-radio-card value="a" label="A"></ml-radio-card>
			<ml-radio-card value="b" label="B"></ml-radio-card>
			<ml-radio-card value="c" label="C"></ml-radio-card>
		`;
		await flush();

		const cards = [...group.querySelectorAll('ml-radio-card')];
		expect(cards.filter((card) => card.hasAttribute('tab-stop'))).toHaveLength(1);

		group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		await flush();

		expect((group as unknown as { value: string }).value).toBe('b');
		expect(cards[1].hasAttribute('selected')).toBe(true);
		expect(cards.filter((card) => card.hasAttribute('tab-stop'))).toHaveLength(1);
		expect(cards[1].hasAttribute('tab-stop')).toBe(true);
	});

	it('wraps around at the ends', async () => {
		const group = await mount('ml-radio-card-group');
		group.innerHTML = `
			<ml-radio-card value="a" label="A"></ml-radio-card>
			<ml-radio-card value="b" label="B"></ml-radio-card>
		`;
		await flush();

		group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
		await flush();

		expect((group as unknown as { value: string }).value).toBe('b');
	});
});

/** C28 — role="tab" divs with no Enter/Space activation. */
describe('ml-steps keyboard activation', () => {
	it('activates a step on Enter', async () => {
		const steps = await mount('ml-steps', {
			steps: [
				{ value: 'a', label: 'A' },
				{ value: 'b', label: 'B' }
			],
			active: 'a'
		});
		await flush();

		const changes: string[] = [];
		steps.addEventListener('ml:change', (event) => changes.push((event as CustomEvent<{ value: string }>).detail.value));

		const second = queryAll<HTMLElement>(steps, '[role="tab"]')[1];
		second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		await flush();

		expect(changes).toContain('b');
	});
});

/** C38 — an unknown icon name rendered an empty <i> with no diagnostic. */
describe('ml-icon', () => {
	it('warns in dev about a name that is not a Phosphor icon', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		setDevMode(true);

		await mount('ml-icon', {}, { attributes: { icon: 'definitely-not-an-icon' } });
		await flush();

		expect(warn.mock.calls.some((call) => String(call[1]).includes('not a known Phosphor icon'))).toBe(true);
		warn.mockRestore();
	});

	it('renders a known icon without warning', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		setDevMode(true);

		const icon = await mount('ml-icon', {}, { attributes: { icon: 'check' } });
		await flush();

		expect(query(icon, 'i')!.textContent).not.toBe('');
		expect(warn.mock.calls.some((call) => String(call[1]).includes('not a known Phosphor icon'))).toBe(false);
		warn.mockRestore();
	});
});
