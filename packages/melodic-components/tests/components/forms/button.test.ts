import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/forms/button/button.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass,
	captureEvent
} from '../../helpers/component-test-utils';

describe('ml-button', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders a button element', () => {
		el = createComponent('ml-button');
		expect(shadowQuery(el, 'button.ml-button')).toBeTruthy();
	});

	it('applies variant class', async () => {
		el = createComponent('ml-button', { properties: { variant: 'secondary' } });
		await flush();
		expect(shadowHasClass(el, '.ml-button', 'ml-button--secondary')).toBe(true);
	});

	it('applies size class', async () => {
		el = createComponent('ml-button', { properties: { size: 'lg' } });
		await flush();
		expect(shadowHasClass(el, '.ml-button', 'ml-button--lg')).toBe(true);
	});

	it('defaults to primary variant and md size', () => {
		el = createComponent('ml-button');
		expect(shadowHasClass(el, '.ml-button', 'ml-button--primary')).toBe(true);
		expect(shadowHasClass(el, '.ml-button', 'ml-button--md')).toBe(true);
	});

	it('applies disabled class when disabled', async () => {
		el = createComponent('ml-button', { properties: { disabled: true } });
		await flush();
		expect(shadowHasClass(el, '.ml-button', 'ml-button--disabled')).toBe(true);
	});

	it('applies loading class and shows spinner when loading', async () => {
		el = createComponent('ml-button', { properties: { loading: true } });
		await flush();
		expect(shadowHasClass(el, '.ml-button', 'ml-button--loading')).toBe(true);
		expect(shadowQuery(el, '.ml-button__spinner')).toBeTruthy();
	});

	it('is effectively disabled when loading', async () => {
		el = createComponent('ml-button', { properties: { loading: true } });
		await flush();
		expect(shadowHasClass(el, '.ml-button', 'ml-button--disabled')).toBe(true);
	});

	it('emits ml:click event when clicked', async () => {
		el = createComponent('ml-button');
		const eventPromise = captureEvent(el, 'ml:click');
		const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
		btn.click();
		const event = await eventPromise;
		expect(event).toBeTruthy();
	});

	it('does not emit ml:click when disabled', async () => {
		el = createComponent('ml-button', { properties: { disabled: true } });
		await flush();
		let fired = false;
		el.addEventListener('ml:click', () => { fired = true; });
		const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
		btn.click();
		await flush();
		expect(fired).toBe(false);
	});

	it('does not emit ml:click when loading', async () => {
		el = createComponent('ml-button', { properties: { loading: true } });
		await flush();
		let fired = false;
		el.addEventListener('ml:click', () => { fired = true; });
		const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
		btn.click();
		await flush();
		expect(fired).toBe(false);
	});

	it('sets role="button" on init', () => {
		el = createComponent('ml-button');
		expect(el.getAttribute('role')).toBe('button');
	});
});
