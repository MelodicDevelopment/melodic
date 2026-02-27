import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/forms/input/input.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass,
	captureEvent,
	focusShadow,
	blurShadow,
	typeInto
} from '../../helpers/component-test-utils';

describe('ml-input', () => {
	let el: HTMLElement;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders with default state', () => {
		el = createComponent('ml-input');
		expect(shadowQuery(el, '.ml-input')).toBeTruthy();
		expect(shadowQuery(el, 'input.ml-input__field')).toBeTruthy();
	});

	it('renders a label when set', async () => {
		el = createComponent('ml-input', { properties: { label: 'Email' } });
		await flush();
		const label = shadowQuery(el, '.ml-input__label');
		expect(label).toBeTruthy();
		expect(label!.textContent).toContain('Email');
	});

	it('renders required indicator when required', async () => {
		el = createComponent('ml-input', { properties: { label: 'Name', required: true } });
		await flush();
		const required = shadowQuery(el, '.ml-input__required');
		expect(required).toBeTruthy();
		expect(required!.textContent).toContain('*');
	});

	it('renders hint text', async () => {
		el = createComponent('ml-input', { properties: { hint: 'Enter your name' } });
		await flush();
		const hint = shadowQuery(el, '.ml-input__hint');
		expect(hint).toBeTruthy();
		expect(hint!.textContent).toContain('Enter your name');
	});

	it('renders error message and applies error class', async () => {
		el = createComponent('ml-input', { properties: { error: 'Required field' } });
		await flush();
		const error = shadowQuery(el, '.ml-input__error');
		expect(error).toBeTruthy();
		expect(error!.textContent).toContain('Required field');
		expect(shadowHasClass(el, '.ml-input', 'ml-input--error')).toBe(true);
	});

	it('applies size variant class', async () => {
		el = createComponent('ml-input', { properties: { size: 'lg' } });
		await flush();
		expect(shadowHasClass(el, '.ml-input', 'ml-input--lg')).toBe(true);
	});

	it('defaults to md size', () => {
		el = createComponent('ml-input');
		expect(shadowHasClass(el, '.ml-input', 'ml-input--md')).toBe(true);
	});

	// REGRESSION: focused property must trigger re-render and add/remove class
	it('adds ml-input--focused class on focus', async () => {
		el = createComponent('ml-input');
		expect(shadowHasClass(el, '.ml-input', 'ml-input--focused')).toBe(false);

		focusShadow(el, '#input');
		await flush();
		expect(shadowHasClass(el, '.ml-input', 'ml-input--focused')).toBe(true);
	});

	// REGRESSION: focused property must trigger re-render on blur
	it('removes ml-input--focused class on blur', async () => {
		el = createComponent('ml-input');
		focusShadow(el, '#input');
		await flush();
		expect(shadowHasClass(el, '.ml-input', 'ml-input--focused')).toBe(true);

		blurShadow(el, '#input');
		await flush();
		expect(shadowHasClass(el, '.ml-input', 'ml-input--focused')).toBe(false);
	});

	it('emits ml:input event on input', async () => {
		el = createComponent('ml-input');
		const eventPromise = captureEvent(el, 'ml:input');
		await typeInto(el, '#input', 'hello');
		const event = await eventPromise;
		expect(event.detail.value).toBe('hello');
	});

	it('emits ml:change event on change', async () => {
		el = createComponent('ml-input');
		const eventPromise = captureEvent(el, 'ml:change');
		const input = shadowQuery<HTMLInputElement>(el, '#input')!;
		input.value = 'changed';
		input.dispatchEvent(new Event('change', { bubbles: true }));
		const event = await eventPromise;
		expect(event.detail.value).toBe('changed');
	});

	it('emits ml:focus and ml:blur events', async () => {
		el = createComponent('ml-input');

		const focusPromise = captureEvent(el, 'ml:focus');
		focusShadow(el, '#input');
		await focusPromise;

		const blurPromise = captureEvent(el, 'ml:blur');
		blurShadow(el, '#input');
		await blurPromise;
	});

	it('applies disabled class when disabled', async () => {
		el = createComponent('ml-input', { properties: { disabled: true } });
		await flush();
		expect(shadowHasClass(el, '.ml-input', 'ml-input--disabled')).toBe(true);
	});
});
