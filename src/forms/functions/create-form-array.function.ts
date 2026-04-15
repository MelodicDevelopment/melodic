import { FormArray } from '../classes/form-array.class';
import { AbstractControl } from '../classes/abstract-control.class';
import type { ControlOptions } from '../types/control.types';

export function createFormArray<T>(controls: AbstractControl<T>[], options?: ControlOptions<T[]>): FormArray<T> {
	return new FormArray(controls, options);
}
