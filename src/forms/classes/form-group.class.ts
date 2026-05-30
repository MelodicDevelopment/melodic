import { signal, SignalEffect } from '../../signals';
import type { Signal } from '../../signals';
import type { ControlOptions, SetValueOptions } from '../types/control.types';
import { AbstractControl } from './abstract-control.class';

export type FormGroupControls<T> = {
	[K in keyof T]: AbstractControl<T[K]>;
};

export type FormGroupValue<T> = {
	[K in keyof T]: T[K];
};

export class FormGroup<T = Record<string, unknown>> extends AbstractControl<FormGroupValue<T>> {
	public readonly controls: Signal<FormGroupControls<T>>;

	private readonly _childValueEffect: SignalEffect;

	constructor(initialControls: FormGroupControls<T>, options: ControlOptions<FormGroupValue<T>> = {}) {
		super(FormGroup.computeValue(initialControls), options);

		this.controls = signal<FormGroupControls<T>>({ ...initialControls });

		for (const key of Object.keys(initialControls)) {
			initialControls[key as keyof T].parent = this;
		}

		this.initializeAggregates();

		this._childValueEffect = new SignalEffect(() => {
			const controls = this.controls();
			for (const key of Object.keys(controls)) {
				controls[key as keyof T].value();
			}
			this.value.set(FormGroup.computeValue(controls));
			void this.runValidation();
		});
		this._childValueEffect.run();
	}

	public get<K extends keyof T>(name: K): AbstractControl<T[K]> {
		return this.controls()[name];
	}

	public contains<K extends keyof T>(name: K): boolean {
		return name in this.controls();
	}

	public addControl<K extends string, V>(name: K, control: AbstractControl<V>): void {
		control.parent = this;
		this.controls.update((current) => ({ ...current, [name]: control }) as FormGroupControls<T>);
	}

	public removeControl<K extends keyof T>(name: K): void {
		const controls = this.controls();
		const control = controls[name];
		if (!control) return;

		control.parent = null;

		// Update the controls signal FIRST so the value effect drops its
		// dependency on this control, then destroy it — otherwise the effect
		// could read the control's already-destroyed signals.
		this.controls.update((current) => {
			const next = { ...current };
			delete next[name];
			return next;
		});

		control.destroy();
	}

	public setValue(value: FormGroupValue<T>, options?: SetValueOptions): void {
		if (this._ownDisabled()) return;
		const controls = this.controls();
		const controlKeys = Object.keys(controls);
		const valueKeys = Object.keys(value as Record<string, unknown>);

		// Strict: setValue replaces the whole group. Reject unknown/missing keys
		// so a wrong-shaped value can't silently leave stale data (use patchValue
		// for partial updates).
		for (const key of valueKeys) {
			if (!(key in controls)) {
				throw new Error(`FormGroup.setValue: unknown control name '${key}'. Use patchValue() for partial updates.`);
			}
		}
		for (const key of controlKeys) {
			if (!(key in (value as Record<string, unknown>))) {
				throw new Error(`FormGroup.setValue: missing value for control name '${key}'. Use patchValue() for partial updates.`);
			}
		}

		for (const key of controlKeys) {
			controls[key as keyof T].setValue(value[key as keyof T], options);
		}
		if (options?.markAsPristine) {
			this._dirty.set(false);
		}
	}

	/** Value including disabled controls (which `value()` omits). */
	public override getRawValue(): FormGroupValue<T> {
		return FormGroup.computeValue(this.controls(), true);
	}

	public patchValue(value: Partial<FormGroupValue<T>>, options?: SetValueOptions): void {
		if (this._ownDisabled()) return;
		const controls = this.controls();
		for (const key of Object.keys(value)) {
			if (value[key as keyof T] !== undefined) {
				controls[key as keyof T]?.setValue(value[key as keyof T] as T[keyof T], options);
			}
		}
		if (options?.markAsPristine) {
			this._dirty.set(false);
		}
	}

	public reset(value?: Partial<FormGroupValue<T>>): void {
		const controls = this.controls();
		for (const key of Object.keys(controls)) {
			const resetValue = value?.[key as keyof T];
			controls[key as keyof T].reset(resetValue as T[keyof T]);
		}
	}

	public markAllAsTouched(): void {
		this._touched.set(true);
		const controls = this.controls();
		for (const key of Object.keys(controls)) {
			controls[key as keyof T].markAllAsTouched();
		}
	}

	public markAllAsUntouched(): void {
		this._touched.set(false);
		const controls = this.controls();
		for (const key of Object.keys(controls)) {
			controls[key as keyof T].markAllAsUntouched();
		}
	}

	public markAllAsDirty(): void {
		this._dirty.set(true);
		const controls = this.controls();
		for (const key of Object.keys(controls)) {
			controls[key as keyof T].markAllAsDirty();
		}
	}

	public markAllAsPristine(): void {
		this._dirty.set(false);
		const controls = this.controls();
		for (const key of Object.keys(controls)) {
			controls[key as keyof T].markAllAsPristine();
		}
	}

	public disable(): void {
		this._ownDisabled.set(true);
		const controls = this.controls();
		for (const key of Object.keys(controls)) {
			controls[key as keyof T].disable();
		}
	}

	public enable(): void {
		this._ownDisabled.set(false);
		const controls = this.controls();
		for (const key of Object.keys(controls)) {
			controls[key as keyof T].enable();
		}
	}

	public async validate(): Promise<void> {
		const controls = this.controls();
		await Promise.all(Object.keys(controls).map((key) => controls[key as keyof T].validate()));
		await this.runValidation();
	}

	public destroy(): void {
		if (this._destroyed) return;
		this._destroyed = true;
		this._childValueEffect.destroy();
		const controls = this.controls();
		for (const key of Object.keys(controls)) {
			controls[key as keyof T].destroy();
		}
		this.destroySignals();
		this.controls.destroy();
	}

	protected override computeDirty(): boolean {
		if (this._dirty()) return true;
		const controls = this.controls();
		return Object.keys(controls).some((key) => controls[key as keyof T].dirty());
	}

	protected override computeTouched(): boolean {
		if (this._touched()) return true;
		const controls = this.controls();
		return Object.keys(controls).some((key) => controls[key as keyof T].touched());
	}

	protected override computePending(): boolean {
		if (this._pending()) return true;
		const controls = this.controls();
		return Object.keys(controls).some((key) => controls[key as keyof T].pending());
	}

	protected override hasInvalidChild(): boolean {
		const controls = this.controls();
		return Object.keys(controls).some((key) => controls[key as keyof T].invalid());
	}

	private static computeValue<T>(controls: FormGroupControls<T>, includeDisabled = false): FormGroupValue<T> {
		const result: Partial<FormGroupValue<T>> = {};
		for (const key of Object.keys(controls) as (keyof T)[]) {
			const control = controls[key];
			// Disabled controls are excluded from value() (Angular semantics);
			// getRawValue() passes includeDisabled to get the full set.
			if (!includeDisabled && control.disabled()) {
				continue;
			}
			result[key] = includeDisabled ? control.getRawValue() : control.value();
		}
		return result as FormGroupValue<T>;
	}
}
