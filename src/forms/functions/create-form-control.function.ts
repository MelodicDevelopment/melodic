import { FormControl } from '../classes/form-control.class';
import type { ControlOptions } from '../types/control.types';

export function createFormControl<T>(initialValue: T, options?: ControlOptions<T>): FormControl<T> {
	return new FormControl(initialValue, options);
}
