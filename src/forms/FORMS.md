# Melodic Forms - POC Documentation

A signal-based reactive form handling system for the Melodic framework.

## Installation

Import from the forms module:

```typescript
import {
  createFormControl,
  createFormGroup,
  Validators,
  createValidator,
  createAsyncValidator
} from './_poc/forms';

// Import types
import type { IFormControl, IFormGroup, FormControlOptions } from './_poc/forms';
```

## Quick Start

```typescript
import { createFormControl, createFormGroup, Validators } from './_poc/forms';
import { html } from '@melodicdev/core';

// Create a simple form
const form = createFormGroup({
  name: createFormControl('', { validators: [Validators.required] }),
  email: createFormControl('', { validators: [Validators.required, Validators.email] })
});

// Check validity
console.log(form.valid());  // false (empty required fields)

// Set values
form.get('name').setValue('John');
form.get('email').setValue('john@example.com');

console.log(form.valid());  // true
console.log(form.value());  // { name: 'John', email: 'john@example.com' }
```

---

## FormControl

A `FormControl` wraps a single form field value with validation and state tracking.

### Creating a FormControl

```typescript
// Basic control with initial value
const name = createFormControl('');

// With validators
const email = createFormControl('', {
  validators: [Validators.required, Validators.email]
});

// With async validators
const username = createFormControl('', {
  validators: [Validators.required],
  asyncValidators: [checkUsernameAvailable]
});

// With options
const age = createFormControl<number>(18, {
  validators: [Validators.min(18)],
  disabled: false,
  updateOn: 'blur'  // 'input' | 'blur' | 'submit'
});
```

### Reading Values (Signals)

All state is exposed as signals - call them to read the current value:

```typescript
const control = createFormControl('hello');

// Read current value
control.value();        // 'hello'

// Read state
control.valid();        // true
control.invalid();      // false
control.dirty();        // false (unchanged from initial)
control.pristine();     // true
control.touched();      // false (user hasn't blurred)
control.pending();      // false (no async validation running)
control.disabled();     // false

// Full state object
control.state();
// {
//   dirty: false,
//   touched: false,
//   pristine: true,
//   untouched: true,
//   valid: true,
//   invalid: false,
//   pending: false,
//   disabled: false,
//   enabled: true
// }
```

### Updating Values

```typescript
const control = createFormControl('');

// Set value (marks as dirty, runs validation)
control.setValue('new value');

// Patch value (for object values)
const address = createFormControl({ city: '', zip: '' });
address.patchValue({ city: 'Seattle' });

// Reset to initial value
control.reset();

// Reset to specific value
control.reset('custom initial');
```

### State Management

```typescript
const control = createFormControl('');

// Touch state (typically on blur)
control.markAsTouched();
control.markAsUntouched();

// Dirty state
control.markAsDirty();
control.markAsPristine();

// Enable/disable
control.disable();
control.enable();
```

### Validation

```typescript
const control = createFormControl('', {
  validators: [Validators.required, Validators.minLength(3)]
});

// Read errors
control.errors();       // { required: { code: 'required', message: '...' } }
control.hasError('required');  // true
control.getError('required');  // { code: 'required', message: 'This field is required' }

// Modify validators
control.setValidators([Validators.required]);
control.addValidators([Validators.maxLength(50)]);
control.removeValidators([Validators.required]);

// Force validation
await control.validate();
```

### Subscribing to Changes

```typescript
const control = createFormControl('');

// Subscribe to value changes
const unsubscribe = control.value.subscribe((newValue) => {
  console.log('Value changed:', newValue);
});

// Subscribe to validity changes
control.valid.subscribe((isValid) => {
  console.log('Valid:', isValid);
});

// Cleanup
unsubscribe();
control.destroy();
```

---

## FormGroup

A `FormGroup` manages a collection of `FormControl` instances.

### Creating a FormGroup

```typescript
interface UserForm {
  name: string;
  email: string;
  age: number;
}

const form = createFormGroup<UserForm>({
  name: createFormControl(''),
  email: createFormControl(''),
  age: createFormControl(0)
});
```

### With Group-Level Validators

```typescript
// Custom validator for password confirmation
const passwordsMatch = (value: { password: string; confirm: string }) => {
  if (value.password !== value.confirm) {
    return {
      passwordMismatch: {
        code: 'passwordMismatch',
        message: 'Passwords do not match'
      }
    };
  }
  return null;
};

const form = createFormGroup({
  password: createFormControl('', { validators: [Validators.required, Validators.minLength(8)] }),
  confirm: createFormControl('', { validators: [Validators.required] })
}, {
  validators: [passwordsMatch]
});
```

### Accessing Controls

```typescript
const form = createFormGroup({
  name: createFormControl(''),
  email: createFormControl('')
});

// Get a specific control
const nameControl = form.get('name');
nameControl.setValue('John');

// Check if control exists
form.contains('name');  // true

// Add/remove controls dynamically
form.addControl('phone', createFormControl(''));
form.removeControl('phone');
```

### Reading Group State

```typescript
// Get all values
form.value();  // { name: 'John', email: 'john@example.com' }

// Aggregate state (based on all children)
form.valid();     // true if ALL children valid
form.invalid();   // true if ANY child invalid
form.dirty();     // true if ANY child dirty
form.touched();   // true if ANY child touched
form.pending();   // true if ANY child has pending async validation
form.pristine();  // true if ALL children pristine
```

### Updating Group

```typescript
// Set all values
form.setValue({
  name: 'John',
  email: 'john@example.com'
});

// Patch some values
form.patchValue({
  name: 'Jane'
});

// Reset all controls
form.reset();

// Reset with specific values
form.reset({
  name: 'Default Name'
});
```

### Bulk State Operations

```typescript
form.markAllAsTouched();   // Useful before form submission
form.markAllAsUntouched();
form.markAllAsDirty();
form.markAllAsPristine();

form.disable();  // Disables all controls
form.enable();   // Enables all controls
```

---

## Built-in Validators

```typescript
import { Validators } from './_poc/forms';

// Required - value must not be empty/null/undefined
Validators.required

// String length
Validators.minLength(3)
Validators.maxLength(100)

// Pattern matching
Validators.pattern(/^[A-Z]/)  // Must start with uppercase

// Email format
Validators.email

// Numeric range
Validators.min(0)
Validators.max(100)
Validators.range(0, 100)

// Compose multiple validators
Validators.compose(
  Validators.required,
  Validators.minLength(3),
  Validators.maxLength(50)
)

// Compose async validators
Validators.composeAsync(
  checkUsernameAvailable,
  checkUsernameNotBanned
)
```

---

## Custom Validators

### Synchronous Validator

```typescript
import { createValidator } from './_poc/forms';
import type { ValidatorFn } from './_poc/forms';

// Using factory function
const noSpaces = createValidator<string>(
  'noSpaces',
  (value) => !value.includes(' '),
  'Value cannot contain spaces'
);

// With dynamic message
const minWords = (count: number) => createValidator<string>(
  'minWords',
  (value) => value.split(/\s+/).filter(Boolean).length >= count,
  (value) => `Need at least ${count} words, got ${value.split(/\s+/).filter(Boolean).length}`
);

// Manual validator function
const isEven: ValidatorFn<number> = (value) => {
  if (value % 2 !== 0) {
    return {
      isEven: {
        code: 'isEven',
        message: 'Value must be even',
        params: { actual: value }
      }
    };
  }
  return null;
};
```

### Asynchronous Validator

```typescript
import { createAsyncValidator } from './_poc/forms';

// Check username availability
const usernameAvailable = createAsyncValidator<string>(
  'usernameAvailable',
  async (username) => {
    const response = await fetch(`/api/check-username?u=${username}`);
    const { available } = await response.json();
    return available;
  },
  'Username is already taken'
);

// With debouncing (implement in your validator)
const emailUnique = createAsyncValidator<string>(
  'emailUnique',
  async (email) => {
    await new Promise(r => setTimeout(r, 300)); // debounce
    const res = await fetch(`/api/check-email?e=${encodeURIComponent(email)}`);
    return res.ok;
  },
  'Email is already registered'
);
```

---

## Template Integration

### Using the :formControl Directive

The directive provides two-way binding with automatic state management:

```typescript
import { html } from '@melodicdev/core';
import { createFormControl, createFormGroup, Validators } from './_poc/forms';
// Import to register the directive
import './_poc/forms/directives/form-control.directive';

const form = createFormGroup({
  name: createFormControl('', { validators: [Validators.required] }),
  email: createFormControl('', { validators: [Validators.email] }),
  subscribe: createFormControl(false)
});

const template = html`
  <form @submit=${handleSubmit}>
    <!-- Text input -->
    <input type="text" :formControl=${form.get('name')} />

    <!-- Email input -->
    <input type="email" :formControl=${form.get('email')} />

    <!-- Checkbox -->
    <input type="checkbox" :formControl=${form.get('subscribe')} />

    <!-- Select -->
    <select :formControl=${form.get('country')}>
      <option value="">Select...</option>
      <option value="us">United States</option>
      <option value="uk">United Kingdom</option>
    </select>

    <!-- Textarea -->
    <textarea :formControl=${form.get('bio')}></textarea>

    <button type="submit" .disabled=${form.invalid()}>Submit</button>
  </form>
`;
```

The directive automatically:
- Syncs the control value to the input
- Updates the control on input/change events
- Marks the control as touched on blur
- Adds CSS classes for styling:
  - `mf-valid` / `mf-invalid`
  - `mf-dirty` / `mf-pristine`
  - `mf-touched`
  - `mf-pending`
  - `mf-disabled`

### Manual Binding (Without Directive)

```typescript
const control = createFormControl('');

html`
  <input
    type="text"
    .value=${control.value()}
    @input=${(e: Event) => control.setValue((e.target as HTMLInputElement).value)}
    @blur=${() => control.markAsTouched()}
    .disabled=${control.disabled()}
  />
`;
```

### Displaying Errors

```typescript
import { html, when } from '@melodicdev/core';

const nameControl = createFormControl('', {
  validators: [Validators.required, Validators.minLength(2)]
});

const template = html`
  <div class="form-field">
    <label>Name</label>
    <input type="text" :formControl=${nameControl} />

    ${when(
      nameControl.touched() && nameControl.invalid(),
      () => html`
        <div class="errors">
          ${when(
            nameControl.hasError('required'),
            () => html`<span class="error">Name is required</span>`
          )}
          ${when(
            nameControl.hasError('minLength'),
            () => html`<span class="error">
              Name must be at least ${nameControl.getError('minLength')?.params?.min} characters
            </span>`
          )}
        </div>
      `
    )}
  </div>
`;
```

### Styling Form States

```css
/* Valid/Invalid states */
.mf-invalid.mf-touched {
  border-color: #dc3545;
}

.mf-valid.mf-touched {
  border-color: #28a745;
}

/* Pending async validation */
.mf-pending {
  background-image: url('spinner.gif');
  background-position: right 8px center;
  background-repeat: no-repeat;
}

/* Disabled state */
.mf-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## Complete Example

```typescript
import { MelodicComponent, html, when } from '@melodicdev/core';
import {
  createFormControl,
  createFormGroup,
  Validators,
  createAsyncValidator
} from './_poc/forms';
import type { IFormGroup } from './_poc/forms';

// Async validator
const emailAvailable = createAsyncValidator<string>(
  'emailAvailable',
  async (email) => {
    await new Promise(r => setTimeout(r, 500));
    return !email.includes('taken');
  },
  'This email is already registered'
);

interface RegistrationForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

// Password match group validator
const passwordsMatch = (value: RegistrationForm) => {
  if (value.password !== value.confirmPassword) {
    return {
      passwordMismatch: {
        code: 'passwordMismatch',
        message: 'Passwords do not match'
      }
    };
  }
  return null;
};

@MelodicComponent({
  selector: 'registration-form',
  template: registrationTemplate
})
export class RegistrationFormComponent {
  form: IFormGroup<RegistrationForm> = createFormGroup<RegistrationForm>({
    username: createFormControl('', {
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(20)]
    }),
    email: createFormControl('', {
      validators: [Validators.required, Validators.email],
      asyncValidators: [emailAvailable]
    }),
    password: createFormControl('', {
      validators: [Validators.required, Validators.minLength(8)]
    }),
    confirmPassword: createFormControl('', {
      validators: [Validators.required]
    }),
    acceptTerms: createFormControl(false, {
      validators: [Validators.required]
    })
  }, {
    validators: [passwordsMatch]
  });

  submitting = false;
  submitError: string | null = null;

  async onSubmit(e: Event): Promise<void> {
    e.preventDefault();

    // Touch all fields to show errors
    this.form.markAllAsTouched();

    // Wait for async validation
    await this.form.validate();

    if (this.form.invalid()) {
      return;
    }

    this.submitting = true;
    this.submitError = null;

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.form.value())
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      // Success - redirect or show message
      console.log('Registration successful!');
    } catch (error) {
      this.submitError = (error as Error).message;
    } finally {
      this.submitting = false;
    }
  }

  onReset(): void {
    this.form.reset();
    this.submitError = null;
  }

  onDestroy(): void {
    this.form.destroy();
  }
}

function registrationTemplate(component: RegistrationFormComponent) {
  const { form } = component;

  return html`
    <form @submit=${(e: Event) => component.onSubmit(e)}>
      <h2>Create Account</h2>

      <!-- Username -->
      <div class="field">
        <label for="username">Username</label>
        <input id="username" type="text" :formControl=${form.get('username')} />
        ${when(form.get('username').touched() && form.get('username').invalid(), () => html`
          <div class="error">
            ${form.get('username').hasError('required') ? 'Username is required' : ''}
            ${form.get('username').hasError('minLength') ? 'At least 3 characters required' : ''}
            ${form.get('username').hasError('maxLength') ? 'Maximum 20 characters allowed' : ''}
          </div>
        `)}
      </div>

      <!-- Email -->
      <div class="field">
        <label for="email">Email</label>
        <input id="email" type="email" :formControl=${form.get('email')} />
        ${when(form.get('email').pending(), () => html`
          <span class="checking">Checking availability...</span>
        `)}
        ${when(form.get('email').touched() && form.get('email').invalid(), () => html`
          <div class="error">
            ${form.get('email').hasError('required') ? 'Email is required' : ''}
            ${form.get('email').hasError('email') ? 'Invalid email format' : ''}
            ${form.get('email').hasError('emailAvailable') ? 'Email already registered' : ''}
          </div>
        `)}
      </div>

      <!-- Password -->
      <div class="field">
        <label for="password">Password</label>
        <input id="password" type="password" :formControl=${form.get('password')} />
        ${when(form.get('password').touched() && form.get('password').invalid(), () => html`
          <div class="error">
            ${form.get('password').hasError('required') ? 'Password is required' : ''}
            ${form.get('password').hasError('minLength') ? 'At least 8 characters required' : ''}
          </div>
        `)}
      </div>

      <!-- Confirm Password -->
      <div class="field">
        <label for="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" type="password" :formControl=${form.get('confirmPassword')} />
        ${when(form.hasError('passwordMismatch'), () => html`
          <div class="error">Passwords do not match</div>
        `)}
      </div>

      <!-- Terms -->
      <div class="field checkbox">
        <label>
          <input type="checkbox" :formControl=${form.get('acceptTerms')} />
          I accept the terms and conditions
        </label>
        ${when(form.get('acceptTerms').touched() && form.get('acceptTerms').invalid(), () => html`
          <div class="error">You must accept the terms</div>
        `)}
      </div>

      <!-- Submit Error -->
      ${when(component.submitError, () => html`
        <div class="submit-error">${component.submitError}</div>
      `)}

      <!-- Actions -->
      <div class="actions">
        <button
          type="submit"
          .disabled=${form.invalid() || form.pending() || component.submitting}
        >
          ${component.submitting ? 'Creating Account...' : 'Create Account'}
        </button>
        <button type="button" @click=${() => component.onReset()}>
          Reset
        </button>
      </div>

      <!-- Debug Info -->
      <details>
        <summary>Form State</summary>
        <pre>
Valid: ${form.valid()}
Dirty: ${form.dirty()}
Touched: ${form.touched()}
Pending: ${form.pending()}
Value: ${JSON.stringify(form.value(), null, 2)}
        </pre>
      </details>
    </form>
  `;
}
```

---

## API Reference

### createFormControl<T>(initialValue, options?)

Creates a new `IFormControl<T>`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `ValidatorFn<T>[]` | `[]` | Sync validators |
| `asyncValidators` | `AsyncValidatorFn<T>[]` | `[]` | Async validators |
| `disabled` | `boolean` | `false` | Initial disabled state |
| `updateOn` | `'input' \| 'blur' \| 'submit'` | `'input'` | When to run validation |

### createFormGroup<T>(controls, options?)

Creates a new `IFormGroup<T>`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validators` | `ValidatorFn<T>[]` | `[]` | Group-level sync validators |
| `asyncValidators` | `AsyncValidatorFn<T>[]` | `[]` | Group-level async validators |
| `disabled` | `boolean` | `false` | Initial disabled state for all controls |

### Validators

| Validator | Signature | Description |
|-----------|-----------|-------------|
| `required` | `ValidatorFn<T>` | Value must not be empty |
| `minLength` | `(min: number) => ValidatorFn<string>` | Minimum string length |
| `maxLength` | `(max: number) => ValidatorFn<string>` | Maximum string length |
| `pattern` | `(regex: RegExp) => ValidatorFn<string>` | Must match pattern |
| `email` | `ValidatorFn<string>` | Valid email format |
| `min` | `(min: number) => ValidatorFn<number>` | Minimum number value |
| `max` | `(max: number) => ValidatorFn<number>` | Maximum number value |
| `range` | `(min, max) => ValidatorFn<number>` | Number within range |
| `compose` | `(...validators) => ValidatorFn<T>` | Combine sync validators |
| `composeAsync` | `(...validators) => AsyncValidatorFn<T>` | Combine async validators |

### createValidator<T>(code, validationFn, message)

Creates a custom sync validator.

### createAsyncValidator<T>(code, validationFn, message)

Creates a custom async validator.
