import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/forms/textarea/textarea.component';
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

describe('ml-textarea', () => {
	let el: HTMLElement;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders with default state', () => {
		el = createComponent('ml-textarea');
		expect(shadowQuery(el, '.ml-textarea')).toBeTruthy();
		expect(shadowQuery(el, 'textarea.ml-textarea__field')).toBeTruthy();
	});

	it('renders a label when set', async () => {
		el = createComponent('ml-textarea', { properties: { label: 'Description' } });
		await flush();
		const label = shadowQuery(el, '.ml-textarea__label');
		expect(label).toBeTruthy();
		expect(label!.textContent).toContain('Description');
	});

	it('renders error message and applies error class', async () => {
		el = createComponent('ml-textarea', { properties: { error: 'Too short' } });
		await flush();
		const error = shadowQuery(el, '.ml-textarea__error');
		expect(error).toBeTruthy();
		expect(error!.textContent).toContain('Too short');
		expect(shadowHasClass(el, '.ml-textarea', 'ml-textarea--error')).toBe(true);
	});

	it('applies resize class when resize is true', async () => {
		el = createComponent('ml-textarea', { properties: { resize: true } });
		await flush();
		expect(shadowHasClass(el, '.ml-textarea', 'ml-textarea--resize')).toBe(true);
	});

	it('renders character counter when maxLength is set', async () => {
		el = createComponent('ml-textarea', { properties: { maxLength: 100 } });
		await flush();
		const counter = shadowQuery(el, '.ml-textarea__counter');
		expect(counter).toBeTruthy();
		expect(counter!.textContent).toContain('0');
		expect(counter!.textContent).toContain('100');
	});

	it('updates character counter on input', async () => {
		el = createComponent('ml-textarea', { properties: { maxLength: 100 } });
		await flush();
		await typeInto(el, '#textarea', 'hello');
		const counter = shadowQuery(el, '.ml-textarea__counter');
		expect(counter!.textContent).toContain('5');
	});

	// REGRESSION: focused property must trigger re-render and toggle class
	it('adds ml-textarea--focused class on focus', async () => {
		el = createComponent('ml-textarea');
		expect(shadowHasClass(el, '.ml-textarea', 'ml-textarea--focused')).toBe(false);

		focusShadow(el, '#textarea');
		await flush();
		expect(shadowHasClass(el, '.ml-textarea', 'ml-textarea--focused')).toBe(true);
	});

	// REGRESSION: focused property must trigger re-render on blur
	it('removes ml-textarea--focused class on blur', async () => {
		el = createComponent('ml-textarea');
		focusShadow(el, '#textarea');
		await flush();
		expect(shadowHasClass(el, '.ml-textarea', 'ml-textarea--focused')).toBe(true);

		blurShadow(el, '#textarea');
		await flush();
		expect(shadowHasClass(el, '.ml-textarea', 'ml-textarea--focused')).toBe(false);
	});

	it('emits ml:input event on input', async () => {
		el = createComponent('ml-textarea');
		const eventPromise = captureEvent(el, 'ml:input');
		await typeInto(el, '#textarea', 'hello');
		const event = await eventPromise;
		expect(event.detail.value).toBe('hello');
	});

	it('applies disabled class when disabled', async () => {
		el = createComponent('ml-textarea', { properties: { disabled: true } });
		await flush();
		expect(shadowHasClass(el, '.ml-textarea', 'ml-textarea--disabled')).toBe(true);
	});
});
