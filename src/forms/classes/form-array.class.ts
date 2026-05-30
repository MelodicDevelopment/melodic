import { signal, SignalEffect } from '../../signals';
import type { Signal } from '../../signals';
import type { ControlOptions, SetValueOptions } from '../types/control.types';
import { AbstractControl } from './abstract-control.class';

export class FormArray<T = unknown> extends AbstractControl<T[]> {
	public readonly controls: Signal<AbstractControl<T>[]>;

	private readonly _childValueEffect: SignalEffect;

	constructor(initialControls: AbstractControl<T>[], options: ControlOptions<T[]> = {}) {
		super(initialControls.map((c) => c.value()), options);

		this.controls = signal<AbstractControl<T>[]>([...initialControls]);

		for (const control of initialControls) {
			control.parent = this;
		}

		this.initializeAggregates();

		this._childValueEffect = new SignalEffect(() => {
			const controls = this.controls();
			for (const control of controls) {
				control.value();
			}
			// Disabled controls are excluded from value() (Angular semantics).
			this.value.set(controls.filter((c) => !c.disabled()).map((c) => c.value()));
			void this.runValidation();
		});
		this._childValueEffect.run();
	}

	public get length(): number {
		return this.controls().length;
	}

	public at(index: number): AbstractControl<T> | undefined {
		return this.controls()[index];
	}

	public push(control: AbstractControl<T>): void {
		control.parent = this;
		this.controls.update((current) => [...current, control]);
	}

	public insert(index: number, control: AbstractControl<T>): void {
		control.parent = this;
		this.controls.update((current) => {
			const next = [...current];
			next.splice(index, 0, control);
			return next;
		});
	}

	public removeAt(index: number): void {
		const controls = this.controls();
		const control = controls[index];
		if (!control) return;

		control.parent = null;

		// Update the controls signal FIRST so the value effect drops its
		// dependency on this control, then destroy it.
		this.controls.update((current) => current.filter((_, i) => i !== index));

		control.destroy();
	}

	public clear(): void {
		const controls = this.controls();
		for (const control of controls) {
			control.parent = null;
		}
		// Drop all controls from the signal before destroying them, so the value
		// effect re-runs against the empty list and never reads a dead signal.
		this.controls.set([]);
		for (const control of controls) {
			control.destroy();
		}
	}

	public setValue(value: T[], options?: SetValueOptions): void {
		if (this._ownDisabled()) return;
		const controls = this.controls();

		// Strict: setValue replaces the whole array, so lengths must match.
		if (value.length !== controls.length) {
			throw new Error(
				`FormArray.setValue: expected ${controls.length} value(s) but received ${value.length}. Use patchValue() for partial updates.`
			);
		}

		value.forEach((v, i) => {
			controls[i].setValue(v, options);
		});
		if (options?.markAsPristine) {
			this._dirty.set(false);
		}
	}

	/** Value including disabled controls (which `value()` omits). */
	public override getRawValue(): T[] {
		return this.controls().map((c) => c.getRawValue());
	}

	public patchValue(value: T[], options?: SetValueOptions): void {
		if (this._ownDisabled()) return;
		const controls = this.controls();
		value.forEach((v, i) => {
			if (v !== undefined) {
				controls[i]?.setValue(v, options);
			}
		});
		if (options?.markAsPristine) {
			this._dirty.set(false);
		}
	}

	public reset(value?: T[]): void {
		const controls = this.controls();
		controls.forEach((control, i) => {
			control.reset(value?.[i]);
		});
	}

	public markAllAsTouched(): void {
		this._touched.set(true);
		for (const control of this.controls()) {
			control.markAllAsTouched();
		}
	}

	public markAllAsUntouched(): void {
		this._touched.set(false);
		for (const control of this.controls()) {
			control.markAllAsUntouched();
		}
	}

	public markAllAsDirty(): void {
		this._dirty.set(true);
		for (const control of this.controls()) {
			control.markAllAsDirty();
		}
	}

	public markAllAsPristine(): void {
		this._dirty.set(false);
		for (const control of this.controls()) {
			control.markAllAsPristine();
		}
	}

	public disable(): void {
		this._ownDisabled.set(true);
		for (const control of this.controls()) {
			control.disable();
		}
	}

	public enable(): void {
		this._ownDisabled.set(false);
		for (const control of this.controls()) {
			control.enable();
		}
	}

	public async validate(): Promise<void> {
		await Promise.all(this.controls().map((c) => c.validate()));
		await this.runValidation();
	}

	public destroy(): void {
		if (this._destroyed) return;
		this._destroyed = true;
		this._childValueEffect.destroy();
		for (const control of this.controls()) {
			control.destroy();
		}
		this.destroySignals();
		this.controls.destroy();
	}

	protected override computeDirty(): boolean {
		if (this._dirty()) return true;
		return this.controls().some((c) => c.dirty());
	}

	protected override computeTouched(): boolean {
		if (this._touched()) return true;
		return this.controls().some((c) => c.touched());
	}

	protected override computePending(): boolean {
		if (this._pending()) return true;
		return this.controls().some((c) => c.pending());
	}

	protected override hasInvalidChild(): boolean {
		return this.controls().some((c) => c.invalid());
	}
}
