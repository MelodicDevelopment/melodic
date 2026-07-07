import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import '../../../src/components/forms/autocomplete/autocomplete.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery
} from '../../helpers/component-test-utils';
import { installPopoverPolyfill } from '../../helpers/popover-polyfill';

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('ml-autocomplete', () => {
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

	async function typeSearch(host: HTMLElement, text: string): Promise<void> {
		const input = shadowQuery<HTMLInputElement>(host, '.ml-autocomplete__input')!;
		input.value = text;
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await flush();
	}

	describe('async search race', () => {
		it('ignores a stale slow response that resolves after a newer one', async () => {
			const resolvers: Array<(value: unknown) => void> = [];
			const queries: string[] = [];
			const searchFn = (query: string) => {
				queries.push(query);
				return new Promise((resolve) => resolvers.push(resolve));
			};

			el = createComponent('ml-autocomplete', {
				properties: { searchFn, debounce: 0, minChars: 1, openOnFocus: false }
			});
			await flush();

			// Two in-flight searches
			await typeSearch(el, 'a');
			await sleep(10);
			await typeSearch(el, 'ab');
			await sleep(10);
			expect(queries).toEqual(['a', 'ab']);

			// The newer request resolves first...
			resolvers[1]([{ value: 'ab-result', label: 'AB Result' }]);
			await flush();
			expect(el.asyncOptions.map((o: any) => o.value)).toEqual(['ab-result']);
			expect(el.loading).toBe(false);

			// ...then the stale first request resolves late: it must be ignored.
			resolvers[0]([{ value: 'a-result', label: 'A Result' }]);
			await flush();
			await sleep(1);
			expect(el.asyncOptions.map((o: any) => o.value)).toEqual(['ab-result']);
			expect(el.loading).toBe(false);
		});

		it('keeps loading=true until the latest request resolves', async () => {
			const resolvers: Array<(value: unknown) => void> = [];
			const searchFn = () => new Promise((resolve) => resolvers.push(resolve));

			el = createComponent('ml-autocomplete', {
				properties: { searchFn, debounce: 0, minChars: 1, openOnFocus: false }
			});
			await flush();

			await typeSearch(el, 'a');
			await sleep(10);
			await typeSearch(el, 'ab');
			await sleep(10);

			// Stale request resolving must NOT clear the loading state.
			resolvers[0]([]);
			await flush();
			await sleep(1);
			expect(el.loading).toBe(true);

			resolvers[1]([]);
			await flush();
			await sleep(1);
			expect(el.loading).toBe(false);
		});
	});

	describe('combobox ARIA', () => {
		it('wires the combobox pattern on the input', async () => {
			el = createComponent('ml-autocomplete', { properties: { options } });
			await flush();

			const input = shadowQuery<HTMLInputElement>(el, '.ml-autocomplete__input')!;
			const dropdown = shadowQuery<HTMLElement>(el, '.ml-autocomplete__dropdown')!;

			expect(input.getAttribute('role')).toBe('combobox');
			expect(input.getAttribute('aria-autocomplete')).toBe('list');
			expect(input.getAttribute('aria-haspopup')).toBe('listbox');
			expect(input.getAttribute('aria-expanded')).toBe('false');
			expect(input.getAttribute('aria-controls')).toBe(dropdown.id);
			expect(dropdown.id).not.toBe('');
			// No focused option while closed — attribute must be absent
			expect(input.hasAttribute('aria-activedescendant')).toBe(false);
		});

		it('tracks keyboard focus via aria-activedescendant while open', async () => {
			el = createComponent('ml-autocomplete', { properties: { options } });
			await flush();

			el.component.open();
			await flush();

			const input = shadowQuery<HTMLInputElement>(el, '.ml-autocomplete__input')!;
			expect(input.getAttribute('aria-expanded')).toBe('true');

			const activeId = input.getAttribute('aria-activedescendant');
			expect(activeId).toBeTruthy();
			// The referenced option must exist and be the focused one
			const active = el.shadowRoot!.getElementById(activeId!);
			expect(active).toBeTruthy();
			expect(active!.classList.contains('ml-autocomplete__option--focused')).toBe(true);

			// Arrow down moves the active descendant
			el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
			await flush();
			const nextId = input.getAttribute('aria-activedescendant');
			expect(nextId).toBeTruthy();
			expect(nextId).not.toBe(activeId);

			// Closing removes the attribute
			el.component.close();
			await flush();
			expect(input.hasAttribute('aria-activedescendant')).toBe(false);
		});

		it('gives every option a unique id', async () => {
			el = createComponent('ml-autocomplete', { properties: { options } });
			await flush();
			el.component.open();
			await flush();

			const optionEls = Array.from(el.shadowRoot!.querySelectorAll('.ml-autocomplete__option')) as HTMLElement[];
			expect(optionEls.length).toBe(3);
			const ids = optionEls.map((o) => o.id);
			expect(new Set(ids).size).toBe(3);
			ids.forEach((id) => expect(id).not.toBe(''));
		});
	});
});
