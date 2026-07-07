import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../../src/components/overlays/popover/index';
import { flush } from '../../helpers/component-test-utils';
import { getDeepActiveElement } from '../../../src/utils/accessibility/focus-trap';

/** happy-dom does not implement the Popover API; stub it to fire toggle events. */
function stubPopoverApi(popoverEl: HTMLElement): void {
	let open = false;
	const fire = (newState: 'open' | 'closed'): void => {
		open = newState === 'open';
		const event = new Event('toggle');
		(event as unknown as { newState: string }).newState = newState;
		popoverEl.dispatchEvent(event);
	};
	(popoverEl as any).showPopover = vi.fn(() => fire('open'));
	(popoverEl as any).hidePopover = vi.fn(() => fire('closed'));
	(popoverEl as any).togglePopover = vi.fn(() => fire(open ? 'closed' : 'open'));
}

/** happy-dom reports offsetParent as null; make elements pass the focusable filter. */
function markVisible(el: HTMLElement): void {
	Object.defineProperty(el, 'offsetParent', { get: () => document.body });
}

describe('ml-popover', () => {
	let host: HTMLElement;
	let trigger: HTMLButtonElement;
	let contentButton: HTMLButtonElement;
	let popoverEl: HTMLElement;

	beforeEach(async () => {
		host = document.createElement('ml-popover');
		host.innerHTML = `
			<button slot="trigger">Open</button>
			<button class="inside">Action</button>
		`;
		document.body.appendChild(host);
		await flush();
		await flush();

		trigger = host.querySelector('[slot="trigger"]') as HTMLButtonElement;
		contentButton = host.querySelector('.inside') as HTMLButtonElement;
		markVisible(trigger);
		markVisible(contentButton);

		popoverEl = host.shadowRoot?.querySelector('.ml-popover__content') as HTMLElement;
		stubPopoverApi(popoverEl);
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	function openPopover(): void {
		(popoverEl as any).showPopover();
	}

	function dismiss(): void {
		(popoverEl as any).hidePopover();
	}

	describe('lifecycle events', () => {
		it('emits ml:open when the popover opens', () => {
			const openSpy = vi.fn();
			host.addEventListener('ml:open', openSpy);

			openPopover();

			expect(openSpy).toHaveBeenCalledTimes(1);
		});

		it('emits ml:close when the popover closes', () => {
			const closeSpy = vi.fn();
			host.addEventListener('ml:close', closeSpy);

			openPopover();
			dismiss();

			expect(closeSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('focus management', () => {
		it('moves focus to the first focusable content element on open (trap autoFocus)', () => {
			trigger.focus();
			openPopover();

			expect(getDeepActiveElement()).toBe(contentButton);
		});

		it('restores focus to the trigger on close when focus is still inside', () => {
			trigger.focus();
			openPopover();
			expect(getDeepActiveElement()).toBe(contentButton);

			dismiss();

			expect(getDeepActiveElement()).toBe(trigger);
		});

		it('does NOT steal focus back on pointer light-dismiss when focus moved elsewhere', () => {
			const outside = document.createElement('button');
			markVisible(outside);
			document.body.appendChild(outside);

			trigger.focus();
			openPopover();
			outside.focus();

			dismiss();

			expect(getDeepActiveElement()).toBe(outside);
		});

		it('wraps Tab within the popover content while open', () => {
			openPopover();
			contentButton.focus();

			const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true, cancelable: true });
			contentButton.dispatchEvent(event);

			// Single focusable: Tab from the last wraps to the first (same element).
			expect(event.defaultPrevented).toBe(true);
			expect(getDeepActiveElement()).toBe(contentButton);
		});
	});
});
