import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/data-display/tag/tag.component';
import { flush, createComponent, removeComponent, shadowQuery } from '../../helpers/component-test-utils';

describe('ml-tag dismissal events', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	it('emits ml:dismiss AND the deprecated ml:close when the close button is clicked', async () => {
		el = createComponent('ml-tag', { attributes: { closable: '' } });
		await flush();

		const received: string[] = [];
		el.addEventListener('ml:dismiss', () => received.push('ml:dismiss'));
		el.addEventListener('ml:close', () => received.push('ml:close'));

		const closeButton = shadowQuery<HTMLButtonElement>(el, '.ml-tag__close');
		expect(closeButton).not.toBeNull();
		closeButton!.click();

		expect(received).toEqual(['ml:dismiss', 'ml:close']);
	});

	it('emits neither event when disabled', async () => {
		el = createComponent('ml-tag', { attributes: { closable: '', disabled: '' } });
		await flush();

		const received: string[] = [];
		el.addEventListener('ml:dismiss', () => received.push('ml:dismiss'));
		el.addEventListener('ml:close', () => received.push('ml:close'));

		el.component.handleClose(new Event('click'));

		expect(received).toEqual([]);
	});
});

describe('ml-tag dot color danger/error alias', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	it("renders dot-color 'danger' with the danger dot class", async () => {
		el = createComponent('ml-tag', { attributes: { dot: '' }, properties: { 'dot-color': 'danger' } });
		await flush();
		expect(shadowQuery(el, '.ml-tag__dot--danger')).not.toBeNull();
	});

	it("renders the canonical dot-color 'error' identically to 'danger'", async () => {
		el = createComponent('ml-tag', { attributes: { dot: '' }, properties: { 'dot-color': 'error' } });
		await flush();
		expect(shadowQuery(el, '.ml-tag__dot--danger')).not.toBeNull();
		expect(shadowQuery(el, '.ml-tag__dot--error')).toBeNull();
	});
});
