import { describe, it, expect } from 'vitest';
import { AutocompleteComponent } from '../../packages/melodic-components/src/components/forms/autocomplete/autocomplete.component';

function makeInstance(): AutocompleteComponent {
	const c = new AutocompleteComponent();
	(c as any).elementRef = document.createElement('div');
	return c;
}

describe('ml-autocomplete openOnFocus', () => {
	it('defaults to true', () => {
		const c = makeInstance();
		expect(c.openOnFocus).toBe(true);
	});

	it('handleFocus does not open the dropdown when openOnFocus is false', () => {
		const c = makeInstance();
		c.options = [{ value: 'a', label: 'Alpha' }];
		c.openOnFocus = false;

		c.handleFocus();

		expect(c.isOpen).toBe(false);
	});

	it('handleFocus still opens the dropdown when openOnFocus is true (default)', () => {
		const c = makeInstance();
		c.options = [{ value: 'a', label: 'Alpha' }];

		// open() requires the dropdown element in shadow DOM; stub it out so we can
		// assert intent without a full render pipeline.
		let opened = false;
		c.open = (() => { opened = true; }) as typeof c.open;

		c.handleFocus();

		expect(opened).toBe(true);
	});
});
