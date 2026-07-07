import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/data-display/list/list-item.component';
import { flush, createComponent, removeComponent, shadowQuery } from '../../helpers/component-test-utils';

async function settle(): Promise<void> {
	await flush();
	await new Promise((r) => setTimeout(r, 0));
	await flush();
}

describe('ml-list-item interactive semantics', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('non-interactive items carry role=listitem and are not focusable', async () => {
		el = createComponent('ml-list-item', { properties: { primary: 'Plain' } });
		await settle();
		expect(el.getAttribute('role')).toBe('listitem');
		expect(el.hasAttribute('tabindex')).toBe(false);
	});

	it('interactive items get role=button and tabindex=0', async () => {
		el = createComponent('ml-list-item', {
			attributes: { interactive: '' },
			properties: { primary: 'Clickable' }
		});
		await settle();
		expect(el.getAttribute('role')).toBe('button');
		expect(el.getAttribute('tabindex')).toBe('0');
	});

	it('disabled interactive items lose the tabindex and gain aria-disabled', async () => {
		el = createComponent('ml-list-item', {
			attributes: { interactive: '', disabled: '' },
			properties: { primary: 'Blocked' }
		});
		await settle();
		expect(el.getAttribute('role')).toBe('button');
		expect(el.hasAttribute('tabindex')).toBe(false);
		expect(el.getAttribute('aria-disabled')).toBe('true');
	});

	it('Enter and Space activate the item (host click)', async () => {
		el = createComponent('ml-list-item', {
			attributes: { interactive: '' },
			properties: { primary: 'Clickable' }
		});
		await settle();

		let clicks = 0;
		el.addEventListener('click', () => clicks++);

		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
		await flush();

		expect(clicks).toBe(2);
	});

	it('does not activate when disabled or non-interactive', async () => {
		el = createComponent('ml-list-item', { properties: { primary: 'Plain' } });
		await settle();

		let clicks = 0;
		el.addEventListener('click', () => clicks++);
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

		el.interactive = true;
		el.disabled = true;
		await settle();
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		await flush();

		expect(clicks).toBe(0);
	});
});

describe('ml-list-item slot reactivity', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('projects leading/trailing content inserted after mount', async () => {
		el = createComponent('ml-list-item', { properties: { primary: 'Late slots' } });
		await settle();

		expect(el.hasLeadingSlot).toBe(false);
		const leadingWrapper = shadowQuery<HTMLElement>(el, '.ml-li__leading')!;
		expect(leadingWrapper.classList.contains('ml-li__leading--hidden')).toBe(true);

		const badge = document.createElement('span');
		badge.slot = 'leading';
		badge.textContent = 'B';
		el.appendChild(badge);
		await settle();

		expect(el.hasLeadingSlot).toBe(true);
		expect(leadingWrapper.classList.contains('ml-li__leading--hidden')).toBe(false);
		const slot = leadingWrapper.querySelector('slot') as HTMLSlotElement;
		expect(slot.assignedNodes()).toContain(badge);
	});
});
