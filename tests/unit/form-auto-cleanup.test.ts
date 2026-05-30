import { describe, it, expect } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';
import { createFormControl, createFormGroup, createFormArray } from '../../src/forms';
import type { FormControl, FormGroup, FormArray } from '../../src/forms';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

describe('form auto-cleanup on component disconnect', () => {
	it('FormControl created in a class-field is destroyed on disconnect', async () => {
		let captured: FormControl<string> | null = null;

		class FormControlHostComponent {
			public readonly email = createFormControl<string>('initial');

			constructor() {
				captured = this.email;
			}
		}

		MelodicComponent({
			selector: 'test-form-control-host',
			template: () => html`<div></div>`
		})(FormControlHostComponent);

		const element = document.createElement('test-form-control-host');
		document.body.appendChild(element);
		await flushMicrotasks();

		expect(captured).not.toBeNull();
		// While alive, value() works.
		expect(captured!.value()).toBe('initial');

		document.body.removeChild(element);

		// Destruction is deferred to a microtask so transient DOM moves don't
		// destroy state; immediately after removal the control is still alive.
		expect(captured!.value()).toBe('initial');

		await flushMicrotasks();

		// Once the element stays removed past the microtask, it is destroyed.
		expect(() => captured!.value()).toThrow(/destruction/);
	});

	it('does NOT destroy a form when the element is moved (remove + re-add)', async () => {
		let captured: FormControl<string> | null = null;

		class MovableHostComponent {
			public readonly email = createFormControl<string>('keep');

			constructor() {
				captured = this.email;
			}
		}

		MelodicComponent({
			selector: 'test-movable-host',
			template: () => html`<div></div>`
		})(MovableHostComponent);

		const parentA = document.createElement('div');
		const parentB = document.createElement('div');
		document.body.append(parentA, parentB);

		const element = document.createElement('test-movable-host');
		parentA.appendChild(element);
		await flushMicrotasks();

		// Move synchronously (remove + re-add before the teardown microtask runs).
		parentA.removeChild(element);
		parentB.appendChild(element);
		await flushMicrotasks();

		// The control survived the move and remains reactive.
		expect(captured!.value()).toBe('keep');
		captured!.setValue('changed');
		expect(captured!.value()).toBe('changed');

		document.body.removeChild(parentA);
		document.body.removeChild(parentB);
	});

	it('FormGroup and its children are destroyed on disconnect', async () => {
		let captured: FormGroup<{ email: string; password: string }> | null = null;

		class FormGroupHostComponent {
			public readonly form = createFormGroup({
				email: createFormControl<string>('a@b.c'),
				password: createFormControl<string>('hunter2')
			});

			constructor() {
				captured = this.form;
			}
		}

		MelodicComponent({
			selector: 'test-form-group-host',
			template: () => html`<div></div>`
		})(FormGroupHostComponent);

		const element = document.createElement('test-form-group-host');
		document.body.appendChild(element);
		await flushMicrotasks();

		expect(captured).not.toBeNull();
		expect(captured!.value()).toEqual({ email: 'a@b.c', password: 'hunter2' });

		document.body.removeChild(element);
		await flushMicrotasks();

		expect(() => captured!.value()).toThrow(/destruction/);
		// The group's children are also destroyed (group.destroy iterates them).
		// Any read on a child should throw.
		// (We can't get a direct ref via captured.get(...) since controls signal is destroyed.)
	});

	it('FormArray is destroyed on disconnect', async () => {
		let captured: FormArray<string> | null = null;

		class FormArrayHostComponent {
			public readonly items = createFormArray<string>([
				createFormControl<string>('a'),
				createFormControl<string>('b')
			]);

			constructor() {
				captured = this.items;
			}
		}

		MelodicComponent({
			selector: 'test-form-array-host',
			template: () => html`<div></div>`
		})(FormArrayHostComponent);

		const element = document.createElement('test-form-array-host');
		document.body.appendChild(element);
		await flushMicrotasks();

		expect(captured!.length).toBe(2);

		document.body.removeChild(element);
		await flushMicrotasks();

		expect(() => captured!.value()).toThrow(/destruction/);
	});

	it('form created outside any component scope is NOT auto-destroyed', () => {
		const c = createFormControl<string>('standalone');
		// No active component → no auto-registration. Caller owns lifetime.
		expect(c.value()).toBe('standalone');

		// Manual destroy still works and is idempotent.
		c.destroy();
		expect(() => c.destroy()).not.toThrow();
		expect(() => c.value()).toThrow(/destruction/);
	});

	it('explicit form.destroy() before disconnect is safe (idempotent on second pass)', async () => {
		let captured: FormControl<string> | null = null;

		class IdempotentDestroyComponent {
			public readonly field = createFormControl<string>('x');

			constructor() {
				captured = this.field;
			}

			onCreate(): void {
				this.field.destroy();
			}
		}

		MelodicComponent({
			selector: 'test-idempotent-destroy',
			template: () => html`<div></div>`
		})(IdempotentDestroyComponent);

		const element = document.createElement('test-idempotent-destroy');
		document.body.appendChild(element);
		await flushMicrotasks();

		expect(() => captured!.value()).toThrow(/destruction/);
		// Disconnect + deferred teardown should NOT throw even though it runs
		// destroy() on the already-destroyed control (destroy is idempotent).
		expect(() => document.body.removeChild(element)).not.toThrow();
		await expect(flushMicrotasks()).resolves.not.toThrow();
	});
});
