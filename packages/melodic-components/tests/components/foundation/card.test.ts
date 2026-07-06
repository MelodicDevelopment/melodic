import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/foundation/card/card.component';
import { flush, createComponent, removeComponent, shadowQuery } from '../../helpers/component-test-utils';

async function settle(): Promise<void> {
	await flush();
	await new Promise((r) => setTimeout(r, 0));
	await flush();
}

describe('ml-card slot reactivity', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('hides header/footer wrappers when the slots are empty', async () => {
		el = createComponent('ml-card');
		await settle();

		expect(el.hasHeader).toBe(false);
		expect(el.hasFooter).toBe(false);
		expect(shadowQuery<HTMLElement>(el, '.ml-card__header')!.classList.contains('ml-card__header--hidden')).toBe(true);
		expect(shadowQuery<HTMLElement>(el, '.ml-card__footer')!.classList.contains('ml-card__footer--hidden')).toBe(true);
	});

	it('shows header content that exists at creation', async () => {
		el = document.createElement('ml-card');
		el.innerHTML = '<h3 slot="header">Title</h3><p>Body</p>';
		document.body.appendChild(el);
		await settle();

		expect(el.hasHeader).toBe(true);
		expect(shadowQuery<HTMLElement>(el, '.ml-card__header')!.classList.contains('ml-card__header--hidden')).toBe(false);
	});

	it('projects header/footer content inserted AFTER mount', async () => {
		el = createComponent('ml-card');
		await settle();
		expect(el.hasFooter).toBe(false);

		const footer = document.createElement('div');
		footer.slot = 'footer';
		footer.textContent = 'Late footer';
		el.appendChild(footer);
		await settle();

		expect(el.hasFooter).toBe(true);
		const wrapper = shadowQuery<HTMLElement>(el, '.ml-card__footer')!;
		expect(wrapper.classList.contains('ml-card__footer--hidden')).toBe(false);
		const slot = wrapper.querySelector('slot') as HTMLSlotElement;
		expect(slot.assignedNodes()).toContain(footer);
	});

	it('hides the wrapper again when slotted content is removed', async () => {
		el = document.createElement('ml-card');
		const header = document.createElement('h3');
		header.slot = 'header';
		header.textContent = 'Title';
		el.appendChild(header);
		document.body.appendChild(el);
		await settle();
		expect(el.hasHeader).toBe(true);

		header.remove();
		await settle();
		expect(el.hasHeader).toBe(false);
		expect(shadowQuery<HTMLElement>(el, '.ml-card__header')!.classList.contains('ml-card__header--hidden')).toBe(true);
	});
});
