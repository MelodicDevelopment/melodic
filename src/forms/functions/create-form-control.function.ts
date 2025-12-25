import { FormControl } from '../classes/form-control.class';
import type { IFormControl, FormControlOptions } from '../types/form-control.types';

/**
 * Creates a new form control with the given initial value and options.
 *
 * @example
 * ```typescript
 * const nameControl = createFormControl('', {
 *   validators: [Validators.required, Validators.minLength(3)]
 * });
 *
 * const emailControl = createFormControl('', {
 *   validators: [Validators.required, Validators.email],
 *   asyncValidators: [uniqueEmailValidator]
 * });
 * ```
 */
export function createFormControl<T>(initialValue: T, options?: FormControlOptions<T>): IFormControl<T> {
	return new FormControl(initialValue, options);
}
