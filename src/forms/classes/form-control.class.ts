import type { ControlOptions, SetValueOptions } from '../types/control.types';
import { AbstractControl } from './abstract-control.class';

export class FormControl<T = unknown> extends AbstractControl<T> {
	public readonly initialValue: T;

	constructor(initialValue: T, options: ControlOptions<T> = {}) {
		super(initialValue, options);
		this.initialValue = initialValue;
		this.initializeAggregates();
		void this.runValidation();
	}

	public setValue(value: T, options?: SetValueOptions): void {
		if (this._ownDisabled()) return;

		this.value.set(value);
		this._dirty.set(!options?.markAsPristine);

		if (this.updateOn === 'change') {
			void this.runValidation();
		}
	}

	public patchValue(value: Partial<T>, options?: SetValueOptions): void {
		const current = this.value();
		if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
			this.setValue({ ...current, ...value } as T, options);
		} else {
			this.setValue(value as T, options);
		}
	}

	public reset(value?: T): void {
		this.value.set(value ?? this.initialValue);
		this._dirty.set(false);
		this._touched.set(false);
		this.errors.set(null);
		void this.runValidation();
	}

	public destroy(): void {
		this.destroySignals();
	}
}
