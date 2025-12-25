import { FormGroup } from '../classes/form-group.class';
import type { FormGroupControls, FormGroupOptions, IFormGroup } from '../types/form-group.types';

/**
 * Creates a new form group with the given controls and options.
 *
 * @example
 * ```typescript
 * const form = createFormGroup({
 *   name: createFormControl('', { validators: [Validators.required] }),
 *   email: createFormControl('', { validators: [Validators.email] }),
 *   age: createFormControl<number | null>(null, { validators: [Validators.min(18)] })
 * });
 * ```
 */
export function createFormGroup<T extends Record<string, unknown>>(controls: FormGroupControls<T>, options?: FormGroupOptions<T>): IFormGroup<T> {
	return new FormGroup(controls, options);
}
