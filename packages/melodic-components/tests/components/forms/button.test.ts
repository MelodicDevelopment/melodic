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

	// The host must NOT get role="button": the shadow DOM renders a real
	// <button>, and a host role would announce button-in-button to screen readers.
	it('does not set role="button" on the host', () => {
		el = createComponent('ml-button');
		expect(el.getAttribute('role')).toBeNull();
	});

	describe('form association', () => {
		let form: HTMLFormElement;

		afterEach(() => {
			form?.remove();
		});

		function createButtonInForm(type: string): HTMLElement {
			form = document.createElement('form');
			document.body.appendChild(form);
			const button = document.createElement('ml-button');
			button.setAttribute('type', type);
			form.appendChild(button);
			return button;
		}

		it('submits the wrapping form when type="submit" is clicked', async () => {
			el = createButtonInForm('submit');
			await flush();

			let submitted = false;
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				submitted = true;
			});

			shadowQuery<HTMLButtonElement>(el, 'button')!.click();
			await flush();
			expect(submitted).toBe(true);
		});

		it('does not submit the form when type="button" is clicked', async () => {
			el = createButtonInForm('button');
			await flush();

			let submitted = false;
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				submitted = true;
			});

			shadowQuery<HTMLButtonElement>(el, 'button')!.click();
			await flush();
			expect(submitted).toBe(false);
		});

		it('does not submit when disabled', async () => {
			el = createButtonInForm('submit');
			(el as any).disabled = true;
			await flush();

			let submitted = false;
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				submitted = true;
			});

			shadowQuery<HTMLButtonElement>(el, 'button')!.click();
			await flush();
			expect(submitted).toBe(false);
		});

		it('submits when the button is nested inside the form under other elements', async () => {
			form = document.createElement('form');
			document.body.appendChild(form);
			const wrapper = document.createElement('div');
			form.appendChild(wrapper);
			el = document.createElement('ml-button');
			el.setAttribute('type', 'submit');
			wrapper.appendChild(el);
			await flush();

			let submitted = false;
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				submitted = true;
			});

			shadowQuery<HTMLButtonElement>(el, 'button')!.click();
			await flush();
			expect(submitted).toBe(true);
		});

		it('resets the wrapping form when type="reset" is clicked', async () => {
			el = createButtonInForm('reset');
			await flush();

			const input = document.createElement('input');
			input.name = 'field';
			input.value = 'typed';
			form.appendChild(input);

			shadowQuery<HTMLButtonElement>(el, 'button')!.click();
			await flush();
			expect(input.value).toBe('');
		});
	});
});

describe('ml-button danger/error variant alias', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	it("renders variant='danger' with the danger class", async () => {
		el = createComponent('ml-button', { attributes: { variant: 'danger' } });
		await flush();
		expect(shadowHasClass(el, 'button', 'ml-button--danger')).toBe(true);
	});

	it("renders the canonical variant='error' identically to 'danger'", async () => {
		el = createComponent('ml-button', { attributes: { variant: 'error' } });
		await flush();
		expect(shadowHasClass(el, 'button', 'ml-button--danger')).toBe(true);
		expect(shadowHasClass(el, 'button', 'ml-button--error')).toBe(false);
	});
});
