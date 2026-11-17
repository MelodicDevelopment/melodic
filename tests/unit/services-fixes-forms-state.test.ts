import { describe, it, expect, afterEach } from 'vitest';
import { Validators, createFormArray, createFormControl, createFormGroup } from '../../src/forms';
import { formControlDirective } from '../../src/forms/directives/form-control.directive';
import { ComponentStateBaseService, createAction, createReducer, onAction, props } from '../../src/state';
import { getHook, resetHook, setDevMode } from '../../src/devtools';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('forms fixes (2026-11 review)', () => {
	it('setValue / patchValue write to disabled controls', () => {
		const control = createFormControl<string>('x', { disabled: true });
		control.setValue('y');
		expect(control.value()).toBe('y');

		const group = createFormGroup({
			a: createFormControl<string>('a', { disabled: true }),
			b: createFormControl<string>('b')
		});

		group.patchValue({ a: 'A', b: 'B' });
		expect(group.getRawValue()).toEqual({ a: 'A', b: 'B' });
		// Disabled controls stay out of value().
		expect(group.value()).toEqual({ b: 'B' });

		group.setValue({ a: 'A2', b: 'B2' });
		expect(group.getRawValue()).toEqual({ a: 'A2', b: 'B2' });
	});

	it('a disabled group or array still accepts programmatic writes', () => {
		const group = createFormGroup({ a: createFormControl<string>('a') });
		group.disable();
		group.patchValue({ a: 'A' });
		expect(group.getRawValue()).toEqual({ a: 'A' });

		const array = createFormArray<string>([createFormControl<string>('x')]);
		array.disable();
		array.setValue(['X']);
		expect(array.getRawValue()).toEqual(['X']);
	});

	it('clears stale sync errors while an async validator is pending', async () => {
		let release!: () => void;
		const control = createFormControl<string>('', {
			validators: [Validators.required],
			asyncValidators: [
				() =>
					new Promise((resolve) => {
						release = () => resolve(null);
					})
			]
		});

		await tick();
		expect(control.hasError('required')).toBe(true);

		control.setValue('ok');
		await tick();

		expect(control.pending()).toBe(true);
		expect(control.errors()).toBeNull();
		expect(control.invalid()).toBe(false);

		release();
		await tick();
		expect(control.pending()).toBe(false);
		expect(control.valid()).toBe(true);
	});

	it('Validators.pattern gives the same answer every time for a global regex', () => {
		const validator = Validators.pattern(/^a+$/g);

		expect(validator('aaa')).toBeNull();
		expect(validator('aaa')).toBeNull();
		expect(validator('aaa')).toBeNull();
		expect(validator('b')).not.toBeNull();
	});

	describe(':formControl deferred writes', () => {
		let cleanup: (() => void) | void;
		let input: HTMLInputElement;

		afterEach(() => {
			if (cleanup) cleanup();
			input?.remove();
		});

		it("updateOn: 'blur' does not dirty a control the user only tabbed through", () => {
			const control = createFormControl<string>('abc', { updateOn: 'blur' });
			input = document.createElement('input');
			document.body.appendChild(input);
			cleanup = formControlDirective(input, control, 'formControl');

			input.dispatchEvent(new Event('focusout'));

			expect(control.touched()).toBe(true);
			expect(control.dirty()).toBe(false);

			input.value = 'abcd';
			input.dispatchEvent(new Event('focusout'));

			expect(control.value()).toBe('abcd');
			expect(control.dirty()).toBe(true);
		});

		it("updateOn: 'submit' does not dirty an unchanged control", () => {
			const control = createFormControl<string>('abc', { updateOn: 'submit' });
			const form = document.createElement('form');
			input = document.createElement('input');
			form.appendChild(input);
			document.body.appendChild(form);
			cleanup = formControlDirective(input, control, 'formControl');

			form.dispatchEvent(new Event('submit'));
			expect(control.dirty()).toBe(false);
			expect(control.touched()).toBe(true);

			input.value = 'changed';
			form.dispatchEvent(new Event('submit'));
			expect(control.value()).toBe('changed');
			expect(control.dirty()).toBe(true);

			form.remove();
		});
	});
});

describe('state fixes (2026-11 review)', () => {
	it('ComponentStateBaseService applies every reducer registered for an action', () => {
		type S = { count: number; log: string[] };
		const bump = createAction('[Fix] Bump', props<{ by: number }>());

		class Store extends ComponentStateBaseService<S> {
			constructor() {
				super(
					{ count: 0, log: [] },
					createReducer<S>(
						onAction(bump, (state: S, action) => ({ ...state, count: state.count + action.payload.by })),
						onAction(bump, (state: S) => ({ ...state, log: [...state.log, `count=${state.count}`] }))
					)
				);
			}

			public read(): S {
				return this.state;
			}
		}

		const store = new Store();
		store.dispatch(bump({ by: 2 }));

		// Both ran, in registration order (the second saw the first's result).
		expect(store.read()).toEqual({ count: 2, log: ['count=2'] });
	});
});

describe('devtools fixes (2026-11 review)', () => {
	afterEach(() => {
		resetHook();
		setDevMode(null);
	});

	it('hook.listening goes back to false when the last listener unsubscribes', () => {
		setDevMode(true);
		resetHook();
		const hook = getHook()!;

		expect(hook.listening).toBe(false);

		const offA = hook.on('*', () => undefined);
		const offB = hook.on('nav:end', () => undefined);
		expect(hook.listening).toBe(true);

		offA();
		expect(hook.listening).toBe(true);
		offB();
		offB();
		expect(hook.listening).toBe(false);
	});
});
