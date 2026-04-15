import { describe, it, expect } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';
import {
	AbstractControl,
	FormControl,
	FormGroup,
	FormArray,
	createFormControl,
	createFormGroup,
	createFormArray,
	Validators,
	createValidator,
	registerDefaultMessages
} from '../../src/forms';
import '../../src/forms/directives/form-control.directive';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

describe('AbstractControl behavior', () => {
	it('aggregates state into a single signal', () => {
		const c = createFormControl<string>('', { validators: [Validators.required] });
		const state = c.state();

		expect(state.invalid).toBe(true);
		expect(state.valid).toBe(false);
		expect(state.touched).toBe(false);
		expect(state.dirty).toBe(false);
		expect(state.pristine).toBe(true);
		expect(state.untouched).toBe(true);
	});

	it('marks dirty on setValue and touched on markAsTouched', () => {
		const c = createFormControl<string>('hello');
		expect(c.dirty()).toBe(false);
		expect(c.touched()).toBe(false);

		c.setValue('world');
		expect(c.dirty()).toBe(true);

		c.markAsTouched();
		expect(c.touched()).toBe(true);
	});

	it('reset clears value, dirty, touched, errors', () => {
		const c = createFormControl<string>('initial', { validators: [Validators.required] });
		c.setValue('changed');
		c.markAsTouched();
		expect(c.dirty()).toBe(true);
		expect(c.touched()).toBe(true);

		c.reset();
		expect(c.value()).toBe('initial');
		expect(c.dirty()).toBe(false);
		expect(c.touched()).toBe(false);
	});
});

describe('FormControl validation', () => {
	it('runs validators and reports errors', () => {
		const c = createFormControl<string>('', { validators: [Validators.required, Validators.minLength(3)] });
		expect(c.invalid()).toBe(true);
		expect(c.hasError('required')).toBe(true);

		c.setValue('ab');
		expect(c.hasError('required')).toBe(false);
		expect(c.hasError('minLength')).toBe(true);

		c.setValue('abc');
		expect(c.valid()).toBe(true);
	});

	it('respects updateOn: blur', () => {
		const c = createFormControl<string>('', { validators: [Validators.required], updateOn: 'blur' });
		c.setValue('hello');
		c.errors.set(null);
		c.setValue('');
		// Errors not yet recomputed since updateOn is blur
		expect(c.errors()).toBeNull();

		c.markAsTouched();
		expect(c.hasError('required')).toBe(true);
	});
});

describe('Message resolution', () => {
	it('falls back to global default when no override', () => {
		const c = createFormControl<string>('', { validators: [Validators.required] });
		expect(c.getFirstErrorMessage()).toBe('This field is required');
	});

	it('uses per-control override when provided', () => {
		const c = createFormControl<string>('', {
			validators: [Validators.required],
			messages: { required: 'Custom required message' }
		});
		expect(c.getFirstErrorMessage()).toBe('Custom required message');
	});

	it('walks parent chain for messages', () => {
		const child = createFormControl<string>('', { validators: [Validators.required] });
		const group = createFormGroup<{ child: string }>(
			{ child },
			{ messages: { required: 'Group-level message' } }
		);
		// Force aggregate compute
		void group.value();
		expect(child.getFirstErrorMessage()).toBe('Group-level message');
	});

	it('resolves params for parameterized messages', () => {
		const c = createFormControl<string>('ab', { validators: [Validators.minLength(5)] });
		expect(c.getFirstErrorMessage()).toBe('Minimum length is 5 characters');
	});

	it('falls back to code when no message anywhere', () => {
		const c = createFormControl<string>('', {
			validators: [createValidator('mystery', () => false)]
		});
		expect(c.getFirstErrorMessage()).toBe('mystery');
	});

	it('createValidator registers a default message', () => {
		registerDefaultMessages({}); // noop check
		createValidator<string>('myCustom', () => false, 'My custom default');
		const c = createFormControl<string>('x', {
			validators: [createValidator<string>('myCustom', () => false)]
		});
		expect(c.getFirstErrorMessage()).toBe('My custom default');
	});
});

describe('FormGroup', () => {
	it('aggregates dirty/touched/valid from children', () => {
		const group = createFormGroup<{ a: string; b: string }>({
			a: createFormControl<string>(''),
			b: createFormControl<string>('')
		});

		expect(group.dirty()).toBe(false);
		group.get('a').setValue('hi');
		expect(group.dirty()).toBe(true);
	});

	it('addControl after construction triggers re-aggregation', async () => {
		const group = createFormGroup<{ a: string }>({
			a: createFormControl<string>('')
		});
		expect(group.invalid()).toBe(false);

		const newCtrl = createFormControl<string>('', { validators: [Validators.required] });
		group.addControl('b', newCtrl);
		await flushMicrotasks();

		expect(group.invalid()).toBe(true);
		expect(group.get('b' as 'a')).toBe(newCtrl);
	});

	it('removeControl destroys watcher and removes child', async () => {
		const target = createFormControl<string>('', { validators: [Validators.required] });
		const group = createFormGroup<{ a: string; b: string }>({
			a: createFormControl<string>('valid'),
			b: target
		});
		expect(group.invalid()).toBe(true);

		group.removeControl('b');
		await flushMicrotasks();

		expect(group.contains('b')).toBe(false);
		expect(group.invalid()).toBe(false);
	});

	it('group-level validators set group errors', () => {
		const group = createFormGroup<{ a: string; b: string }>(
			{
				a: createFormControl<string>('one'),
				b: createFormControl<string>('two')
			},
			{
				validators: [
					(value) => (value.a !== value.b ? { mismatch: { code: 'mismatch' } } : null)
				]
			}
		);

		expect(group.hasError('mismatch')).toBe(true);
		group.get('b').setValue('one');
		// runValidation is async; flush to settle
		return flushMicrotasks().then(() => {
			expect(group.hasError('mismatch')).toBe(false);
		});
	});

	it('markAllAsTouched marks all children', () => {
		const a = createFormControl<string>('');
		const b = createFormControl<string>('');
		const group = createFormGroup<{ a: string; b: string }>({ a, b });

		group.markAllAsTouched();
		expect(a.touched()).toBe(true);
		expect(b.touched()).toBe(true);
	});
});

describe('FormArray', () => {
	it('push/removeAt updates length and aggregates', async () => {
		const arr = createFormArray<string>([
			createFormControl<string>('a'),
			createFormControl<string>('b')
		]);
		expect(arr.length).toBe(2);

		arr.push(createFormControl<string>('c', { validators: [Validators.required] }));
		expect(arr.length).toBe(3);

		arr.at(2)?.setValue('');
		await flushMicrotasks();
		expect(arr.invalid()).toBe(true);

		arr.removeAt(2);
		await flushMicrotasks();
		expect(arr.length).toBe(2);
		expect(arr.invalid()).toBe(false);
	});

	it('markAllAsDirty / markAllAsPristine cascade through children', () => {
		const arr = createFormArray<string>([
			createFormControl<string>('a'),
			createFormControl<string>('b'),
			createFormControl<string>('c')
		]);

		expect(arr.dirty()).toBe(false);
		arr.markAllAsDirty();
		expect(arr.dirty()).toBe(true);
		for (let i = 0; i < arr.length; i++) {
			expect(arr.at(i)!.dirty()).toBe(true);
		}

		arr.markAllAsPristine();
		expect(arr.dirty()).toBe(false);
		for (let i = 0; i < arr.length; i++) {
			expect(arr.at(i)!.dirty()).toBe(false);
		}
	});

	it('markAllAsDirty / markAllAsPristine cascade into nested FormGroups', () => {
		const arr = createFormArray([
			createFormGroup({ name: createFormControl<string>('a') }),
			createFormGroup({ name: createFormControl<string>('b') })
		]);

		arr.markAllAsDirty();
		expect(arr.dirty()).toBe(true);
		expect(arr.at(0)!.dirty()).toBe(true);
		expect((arr.at(0) as FormGroup<{ name: string }>).get('name').dirty()).toBe(true);

		arr.markAllAsPristine();
		expect(arr.dirty()).toBe(false);
		expect(arr.at(0)!.dirty()).toBe(false);
		expect((arr.at(0) as FormGroup<{ name: string }>).get('name').dirty()).toBe(false);
	});
});

describe('setValue / patchValue { markAsPristine }', () => {
	it('FormControl: setValue stays pristine when markAsPristine is true', () => {
		const c = createFormControl<string>('initial');
		c.setValue('hydrated', { markAsPristine: true });
		expect(c.value()).toBe('hydrated');
		expect(c.dirty()).toBe(false);
		expect(c.pristine()).toBe(true);
	});

	it('FormControl: setValue still flips to dirty by default', () => {
		const c = createFormControl<string>('initial');
		c.setValue('changed');
		expect(c.dirty()).toBe(true);
	});

	it('FormControl: markAsPristine clears existing dirty state after update', () => {
		const c = createFormControl<string>('initial');
		c.setValue('typed by user');
		expect(c.dirty()).toBe(true);
		c.setValue('server value', { markAsPristine: true });
		expect(c.dirty()).toBe(false);
	});

	it('FormGroup: setValue({ markAsPristine: true }) keeps the whole tree pristine', () => {
		const form = createFormGroup({
			email: createFormControl<string>(''),
			name: createFormControl<string>('')
		});

		form.setValue({ email: 'a@b.co', name: 'Ada' }, { markAsPristine: true });

		expect(form.value()).toEqual({ email: 'a@b.co', name: 'Ada' });
		expect(form.dirty()).toBe(false);
		expect(form.get('email').dirty()).toBe(false);
		expect(form.get('name').dirty()).toBe(false);
	});

	it('FormGroup: patchValue({ markAsPristine: true }) only touches specified keys', () => {
		const form = createFormGroup({
			email: createFormControl<string>('old@example.com'),
			name: createFormControl<string>('')
		});

		form.get('name').setValue('user typed'); // dirty

		form.patchValue({ email: 'new@example.com' }, { markAsPristine: true });

		expect(form.get('email').value()).toBe('new@example.com');
		expect(form.get('email').dirty()).toBe(false);
		// Untouched child's dirty state is preserved
		expect(form.get('name').dirty()).toBe(true);
	});

	it('FormArray: setValue({ markAsPristine: true }) keeps the array + children pristine', () => {
		const arr = createFormArray<string>([
			createFormControl<string>(''),
			createFormControl<string>('')
		]);

		arr.setValue(['first', 'second'], { markAsPristine: true });

		expect(arr.value()).toEqual(['first', 'second']);
		expect(arr.dirty()).toBe(false);
		expect(arr.at(0)!.dirty()).toBe(false);
		expect(arr.at(1)!.dirty()).toBe(false);
	});
});

describe('Component auto-subscribe', () => {
	it('re-renders when bound FormControl state changes', async () => {
		let renderCount = 0;
		const sharedCtrl = createFormControl<string>('hello');

		class FCComp {
			form = sharedCtrl;

			onRender(): void {
				renderCount += 1;
			}
		}

		MelodicComponent({
			selector: 'fc-auto-test',
			template: (c: FCComp) => html`<span>${c.form.value()}</span>`
		})(FCComp);

		const el = document.createElement('fc-auto-test');
		document.body.appendChild(el);
		await flushMicrotasks();
		const before = renderCount;

		sharedCtrl.setValue('world');
		sharedCtrl.markAsTouched();
		await flushMicrotasks();

		expect(renderCount).toBeGreaterThan(before);
		expect(el.shadowRoot?.textContent).toContain('world');
		document.body.removeChild(el);
	});

	it('re-renders when child of bound FormGroup changes', async () => {
		let renderCount = 0;
		const sharedGroup = createFormGroup<{ name: string }>({
			name: createFormControl<string>('initial')
		});

		class FGComp {
			form = sharedGroup;

			onRender(): void {
				renderCount += 1;
			}
		}

		MelodicComponent({
			selector: 'fg-auto-test',
			template: (c: FGComp) => html`<span>${c.form.get('name').value()}</span>`
		})(FGComp);

		const el = document.createElement('fg-auto-test');
		document.body.appendChild(el);
		await flushMicrotasks();
		const before = renderCount;

		sharedGroup.get('name').setValue('changed');
		await flushMicrotasks();

		expect(renderCount).toBeGreaterThan(before);
		expect(el.shadowRoot?.textContent).toContain('changed');
		document.body.removeChild(el);
	});

	it('AbstractControl is detected via instanceof', () => {
		const c = createFormControl<string>('');
		const g = createFormGroup<{ a: string }>({ a: createFormControl<string>('') });
		const a = createFormArray<string>([createFormControl<string>('')]);

		expect(c).toBeInstanceOf(AbstractControl);
		expect(g).toBeInstanceOf(AbstractControl);
		expect(a).toBeInstanceOf(AbstractControl);
	});
});

describe(':formControl directive', () => {
	it('syncs value to native input and back', async () => {
		const ctrl = createFormControl<string>('initial');

		class DirComp {
			ctrl = ctrl;
		}

		MelodicComponent({
			selector: 'dir-input-test',
			template: (c: DirComp) => html`<input :formControl=${c.ctrl} />`
		})(DirComp);

		const el = document.createElement('dir-input-test');
		document.body.appendChild(el);
		await flushMicrotasks();

		const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
		expect(input.value).toBe('initial');

		ctrl.setValue('updated');
		await flushMicrotasks();
		expect(input.value).toBe('updated');

		input.value = 'from-input';
		input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
		expect(ctrl.value()).toBe('from-input');

		document.body.removeChild(el);
	});

	it('sets error attribute on host when touched + invalid', async () => {
		const ctrl = createFormControl<string>('', { validators: [Validators.required] });

		class ErrComp {
			ctrl = ctrl;
		}

		MelodicComponent({
			selector: 'dir-error-test',
			template: (c: ErrComp) => html`<input :formControl=${c.ctrl} />`
		})(ErrComp);

		const el = document.createElement('dir-error-test');
		document.body.appendChild(el);
		await flushMicrotasks();

		const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
		expect(input.hasAttribute('error')).toBe(false);

		ctrl.markAsTouched();
		await flushMicrotasks();
		expect(input.getAttribute('error')).toBe('This field is required');

		ctrl.setValue('hello');
		await flushMicrotasks();
		expect(input.hasAttribute('error')).toBe(false);

		document.body.removeChild(el);
	});

	it('uses message override when provided', async () => {
		const ctrl = createFormControl<string>('', {
			validators: [Validators.required],
			messages: { required: 'Custom!' }
		});

		class OverrideComp {
			ctrl = ctrl;
		}

		MelodicComponent({
			selector: 'dir-override-test',
			template: (c: OverrideComp) => html`<input :formControl=${c.ctrl} />`
		})(OverrideComp);

		const el = document.createElement('dir-override-test');
		document.body.appendChild(el);
		await flushMicrotasks();

		ctrl.markAsTouched();
		await flushMicrotasks();

		const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('error')).toBe('Custom!');

		document.body.removeChild(el);
	});

	it('resolves checkbox adapter for <input type="checkbox">, not text adapter', async () => {
		const ctrl = createFormControl<boolean>(false);

		class CheckboxComp {
			ctrl = ctrl;
		}

		MelodicComponent({
			selector: 'dir-checkbox-test',
			template: (c: CheckboxComp) => html`<input type="checkbox" :formControl=${c.ctrl} />`
		})(CheckboxComp);

		const el = document.createElement('dir-checkbox-test');
		document.body.appendChild(el);
		await flushMicrotasks();

		const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
		expect(input.checked).toBe(false);

		input.checked = true;
		input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

		expect(ctrl.value()).toBe(true);
		expect(typeof ctrl.value()).toBe('boolean');

		document.body.removeChild(el);
	});

	it('cleans up listeners on disconnect', async () => {
		const ctrl = createFormControl<string>('');

		class CleanComp {
			ctrl = ctrl;
		}

		MelodicComponent({
			selector: 'dir-cleanup-test',
			template: (c: CleanComp) => html`<input :formControl=${c.ctrl} />`
		})(CleanComp);

		const el = document.createElement('dir-cleanup-test');
		document.body.appendChild(el);
		await flushMicrotasks();

		document.body.removeChild(el);
		await flushMicrotasks();

		// After disconnect, control updates should not throw or affect anything
		expect(() => ctrl.setValue('after-disconnect')).not.toThrow();
	});
});
