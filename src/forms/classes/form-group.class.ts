import { signal, SignalEffect } from '../../signals';
import type { Signal } from '../../signals';
import type { ControlOptions } from '../types/control.types';
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
		control.destroy();

		this.controls.update((current) => {
			const next = { ...current };
			delete next[name];
			return next;
		});
	}

	public setValue(value: FormGroupValue<T>): void {
		if (this._ownDisabled()) return;
		const controls = this.controls();
		for (const key of Object.keys(value)) {
			controls[key as keyof T]?.setValue(value[key as keyof T]);
		}
	}

	public patchValue(value: Partial<FormGroupValue<T>>): void {
		if (this._ownDisabled()) return;
		const controls = this.controls();
		for (const key of Object.keys(value)) {
			if (value[key as keyof T] !== undefined) {
				controls[key as keyof T]?.setValue(value[key as keyof T] as T[keyof T]);
			}
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
			const child = controls[key as keyof T];
			if ('markAllAsDirty' in child && typeof (child as { markAllAsDirty?: () => void }).markAllAsDirty === 'function') {
				(child as unknown as { markAllAsDirty: () => void }).markAllAsDirty();
			} else {
				child.markAsDirty();
			}
		}
	}

	public markAllAsPristine(): void {
		this._dirty.set(false);
		const controls = this.controls();
		for (const key of Object.keys(controls)) {
			const child = controls[key as keyof T];
			if ('markAllAsPristine' in child && typeof (child as { markAllAsPristine?: () => void }).markAllAsPristine === 'function') {
				(child as unknown as { markAllAsPristine: () => void }).markAllAsPristine();
			} else {
				child.markAsPristine();
			}
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

	private static computeValue<T>(controls: FormGroupControls<T>): FormGroupValue<T> {
		const result: Partial<FormGroupValue<T>> = {};
		for (const key of Object.keys(controls) as (keyof T)[]) {
			result[key] = controls[key].value();
		}
		return result as FormGroupValue<T>;
	}
}
