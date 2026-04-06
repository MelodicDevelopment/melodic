import { describe, it, expect } from 'vitest';
import { AutocompleteComponent } from '../../packages/melodic-components/src/components/forms/autocomplete/autocomplete.component';

function makeInstance(): AutocompleteComponent {
	const c = new AutocompleteComponent();
	(c as any).elementRef = document.createElement('div');
	return c;
}

describe('ml-autocomplete initialOption fallback', () => {
	it('resolves displayText from initialOption when async options are empty', () => {
		const c = makeInstance();
		c.searchFn = async () => [];
		c.value = '5';
		c.initialOption = { value: '5', label: 'Pathway Church' };

		expect(c.selectedOption).toEqual({ value: '5', label: 'Pathway Church' });
		expect(c.displayText).toBe('Pathway Church');
	});

	it('prefers async result over initialOption when both have the value', () => {
		const c = makeInstance();
		c.searchFn = async () => [];
		c.value = '5';
		c.asyncOptions = [{ value: '5', label: 'From Async' }];
		c.initialOption = { value: '5', label: 'From Initial' };

		expect(c.selectedOption?.label).toBe('From Async');
	});

	it('does not include initialOption in filteredOptions', () => {
		const c = makeInstance();
		c.searchFn = async () => [];
		c.value = '5';
		c.initialOption = { value: '5', label: 'Pathway Church' };

		expect(c.filteredOptions).toEqual([]);
	});

	it('returns undefined when value does not match initialOption', () => {
		const c = makeInstance();
		c.searchFn = async () => [];
		c.value = '99';
		c.initialOption = { value: '5', label: 'Pathway Church' };

		expect(c.selectedOption).toBeUndefined();
		expect(c.displayText).toBe('');
	});

	it('multi mode: merges initialOptions for unresolved values', () => {
		const c = makeInstance();
		c.searchFn = async () => [];
		c.multiple = true;
		c.values = ['5', '7'];
		c.asyncOptions = [{ value: '5', label: 'From Async' }];
		c.initialOptions = [
			{ value: '5', label: 'Stale Initial' },
			{ value: '7', label: 'Initial Seven' }
		];

		const result = c.selectedOptions;
		expect(result).toHaveLength(2);
		expect(result.find((o) => o.value === '5')?.label).toBe('From Async');
		expect(result.find((o) => o.value === '7')?.label).toBe('Initial Seven');
	});
});
