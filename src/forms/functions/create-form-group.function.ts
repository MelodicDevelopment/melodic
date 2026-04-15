import { FormGroup } from '../classes/form-group.class';
import type { FormGroupControls } from '../classes/form-group.class';
import type { ControlOptions } from '../types/control.types';

export function createFormGroup<T>(
	controls: FormGroupControls<T>,
	options?: ControlOptions<{ [K in keyof T]: T[K] }>
): FormGroup<T> {
	return new FormGroup<T>(controls, options);
}
