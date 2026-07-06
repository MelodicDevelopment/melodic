import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/forms/form-field/form-field.component';
import { flush, createComponent, removeComponent, shadowQuery } from '../../helpers/component-test-utils';

describe('ml-form-field', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	async function createFieldWithInput(attributes: Record<string, string> = {}): Promise<HTMLInputElement> {
		el = createComponent('ml-form-field', { attributes });
		const input = document.createElement('input');
		input.type = 'text';
		el.appendChild(input);
		await flush();
		await flush();
		return input;
	}

	it('connects aria-describedby to the hint', async () => {
		const input = await createFieldWithInput({ hint: 'Pick something unique' });
		expect(input.getAttribute('aria-describedby')).toBe(el.hintId);
	});

	it('re-syncs ARIA when an error is set reactively after mount', async () => {
		const input = await createFieldWithInput({ hint: 'Pick something unique' });

		el.error = 'This field is required';
		await flush();

		expect(input.getAttribute('aria-invalid')).toBe('true');
		// BOTH the error and the hint describe the control
		const describedBy = (input.getAttribute('aria-describedby') ?? '').split(/\s+/);
		expect(describedBy).toContain(el.errorId);
		expect(describedBy).toContain(el.hintId);

		// Both referenced elements must exist in the shadow DOM
		expect(el.shadowRoot!.getElementById(el.errorId)).toBeTruthy();
		expect(el.shadowRoot!.getElementById(el.hintId)).toBeTruthy();
	});

	it('removes stale ARIA when the error clears', async () => {
		const input = await createFieldWithInput({});

		el.error = 'Bad value';
		await flush();
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-describedby')).toBe(el.errorId);

		el.error = '';
		await flush();
		expect(input.hasAttribute('aria-invalid')).toBe(false);
		expect(input.hasAttribute('aria-describedby')).toBe(false);
	});

	it('re-syncs aria-required when required changes', async () => {
		const input = await createFieldWithInput({});

		el.required = true;
		await flush();
		expect(input.getAttribute('aria-required')).toBe('true');

		el.required = false;
		await flush();
		expect(input.hasAttribute('aria-required')).toBe(false);
	});

	it('renders the error message and keeps the hint visible', async () => {
		await createFieldWithInput({ hint: 'A hint' });

		el.error = 'An error';
		await flush();

		expect(shadowQuery(el, '.ml-form-field__error')?.textContent?.trim()).toBe('An error');
		expect(shadowQuery(el, '.ml-form-field__hint')?.textContent?.trim()).toBe('A hint');
	});
});
