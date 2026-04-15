// Types
export * from './types';

// Classes
export { AbstractControl, FormControl, FormGroup, FormArray } from './classes';
export type { FormGroupControls, FormGroupValue } from './classes';

// Factory functions
export { createFormControl, createFormGroup, createFormArray } from './functions';

// Validators
export { Validators, createValidator, createAsyncValidator } from './validators';

// Messages
export { registerDefaultMessages, setDefaultMessage, getGlobalMessage, resolveMessage } from './messages';

// Adapters
export { registerAdapter, getAdapter, textAdapter, checkboxAdapter, radioAdapter } from './adapters';

// Directives (auto-registers when imported)
export { formControlDirective } from './directives/form-control.directive';
