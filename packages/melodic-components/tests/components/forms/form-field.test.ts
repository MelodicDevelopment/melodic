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

	// The control is in the LIGHT dom while the hint and error live in this
	// component's shadow root, so an `aria-describedby` IDREF between them can
	// never resolve — it was set, pointed at nothing, and was never announced.
	// The description now crosses the boundary: element references where the
	// engine supports them, otherwise the text itself via `aria-description`.
	// (happy-dom has no ariaDescribedByElements, so these assert the fallback.)
	const describedText = (input: HTMLElement): string =>
		input.getAttribute('aria-description') ??
		((input as HTMLElement & { ariaDescribedByElements?: Element[] | null }).ariaDescribedByElements ?? [])
			.map((element) => element.textContent?.trim() ?? '')
			.join('. ');

	it('describes the control with the hint', async () => {
		const input = await createFieldWithInput({ hint: 'Pick something unique' });
		expect(describedText(input)).toContain('Pick something unique');
	});

	it('re-syncs ARIA when an error is set reactively after mount', async () => {
		const input = await createFieldWithInput({ hint: 'Pick something unique' });

		el.error = 'This field is required';
		await flush();

		expect(input.getAttribute('aria-invalid')).toBe('true');

		// BOTH the error and the hint describe the control.
		const described = describedText(input);
		expect(described).toContain('This field is required');
		expect(described).toContain('Pick something unique');

		// The elements they come from are really rendered.
		expect(el.shadowRoot!.getElementById(el.errorId)).toBeTruthy();
		expect(el.shadowRoot!.getElementById(el.hintId)).toBeTruthy();
	});

	it('removes stale ARIA when the error clears', async () => {
		const input = await createFieldWithInput({});

		el.error = 'Bad value';
		await flush();
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(describedText(input)).toContain('Bad value');

		el.error = '';
		await flush();
		expect(input.hasAttribute('aria-invalid')).toBe(false);
		expect(describedText(input)).toBe('');
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
