import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Importing the barrel registers ml-dropdown, ml-dropdown-item, etc.
import '../../../src/components/overlays/dropdown/index';
import { flush } from '../../helpers/component-test-utils';

/**
 * happy-dom does not implement the Popover API; stub show/hide/toggle on the
 * menu element to dispatch the `toggle` events the component listens for.
 */
function stubPopoverApi(menuEl: HTMLElement): void {
	let open = false;
	const fire = (newState: 'open' | 'closed'): void => {
		open = newState === 'open';
		const event = new Event('toggle');
		(event as unknown as { newState: string }).newState = newState;
		menuEl.dispatchEvent(event);
	};
	(menuEl as any).showPopover = vi.fn(() => fire('open'));
	(menuEl as any).hidePopover = vi.fn(() => fire('closed'));
	(menuEl as any).togglePopover = vi.fn(() => fire(open ? 'closed' : 'open'));
}

describe('ml-dropdown', () => {
	let host: HTMLElement;
	let trigger: HTMLButtonElement;
	let menuEl: HTMLElement;

	beforeEach(async () => {
		host = document.createElement('ml-dropdown');
		host.innerHTML = `
			<button slot="trigger">Options</button>
			<ml-dropdown-item value="edit">Edit</ml-dropdown-item>
			<ml-dropdown-item value="delete">Delete</ml-dropdown-item>
		`;
		document.body.appendChild(host);
		await flush();
		await flush();

		trigger = host.querySelector('button') as HTMLButtonElement;
		menuEl = host.shadowRoot?.querySelector('.ml-dropdown__menu') as HTMLElement;
		stubPopoverApi(menuEl);
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	function openDropdown(): void {
		(menuEl as any).showPopover();
	}

	function dismiss(): void {
		// Light-dismiss path: the Popover API hides the popover and fires toggle.
		(menuEl as any).hidePopover();
	}

	describe('trigger ARIA (menu button pattern)', () => {
		it('sets aria-haspopup="menu" and aria-expanded="false" on the slotted trigger', () => {
			expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
			expect(trigger.getAttribute('aria-expanded')).toBe('false');
		});

		it('reflects open state in aria-expanded', () => {
			openDropdown();
			expect(trigger.getAttribute('aria-expanded')).toBe('true');

			dismiss();
			expect(trigger.getAttribute('aria-expanded')).toBe('false');
		});
	});

	describe('items + aria-activedescendant', () => {
		it('assigns each item host an id and role="menuitem"', async () => {
			const items = Array.from(host.querySelectorAll('ml-dropdown-item'));
			expect(items.length).toBe(2);
			for (const item of items) {
				expect(item.id).not.toBe('');
				expect(item.getAttribute('role')).toBe('menuitem');
				expect(item.getAttribute('aria-disabled')).toBe('false');
			}
		});

		it('points the trigger aria-activedescendant at the virtually focused item', () => {
			openDropdown();

			const items = Array.from(host.querySelectorAll('ml-dropdown-item'));
			// Opening focuses the first enabled item.
			expect(trigger.getAttribute('aria-activedescendant')).toBe(items[0].id);

			host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
			expect(trigger.getAttribute('aria-activedescendant')).toBe(items[1].id);
		});

		it('removes aria-activedescendant when the menu closes', () => {
			openDropdown();
			expect(trigger.getAttribute('aria-activedescendant')).not.toBeNull();

			dismiss();
			expect(trigger.getAttribute('aria-activedescendant')).toBeNull();
		});
	});

	describe('focus restore matrix', () => {
		it('restores focus to the trigger on Escape (keyboard dismissal)', () => {
			openDropdown();
			const focusSpy = vi.spyOn(trigger, 'focus');

			host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

			expect(focusSpy).toHaveBeenCalled();
		});

		it('restores focus to the trigger on Enter selection (keyboard dismissal)', () => {
			openDropdown();
			const focusSpy = vi.spyOn(trigger, 'focus');

			host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

			expect(focusSpy).toHaveBeenCalled();
		});

		it('does NOT steal focus back on pointer light-dismiss when focus moved elsewhere', () => {
			const outside = document.createElement('button');
			document.body.appendChild(outside);

			openDropdown();
			outside.focus();
			const focusSpy = vi.spyOn(trigger, 'focus');

			// Pointer light-dismiss (click outside): popover hides via the Popover API.
			dismiss();

			expect(focusSpy).not.toHaveBeenCalled();
		});

		it('restores focus to the trigger when focus is still inside the dropdown at close', () => {
			openDropdown();

			// Simulate a pointer click on an item: item hosts are click-focusable.
			const item = host.querySelector('ml-dropdown-item') as HTMLElement;
			item.focus();
			const focusSpy = vi.spyOn(trigger, 'focus');

			dismiss();

			expect(focusSpy).toHaveBeenCalled();
		});
	});
});
