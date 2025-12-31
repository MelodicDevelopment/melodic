# Forms

Melodic forms are signal-based, reactive form controls inspired by Angular's reactive forms. They support validation, async validation, form groups, and a built-in `formControl` attribute directive for DOM binding.

## Table of Contents

- [Overview](#overview)
- [FormControl](#formcontrol)
- [FormGroup](#formgroup)
- [Validators](#validators)
- [FormControl Directive](#formcontrol-directive)
- [Putting It Together](#putting-it-together)

## Overview

Importing `@melodicdev/core/forms` registers the `:formControl` directive automatically.

```typescript
import { createFormControl, createFormGroup, Validators } from '@melodicdev/core/forms';

const form = createFormGroup({
	name: createFormControl('', { validators: [Validators.required] }),
	email: createFormControl('', { validators: [Validators.email] })
});
```

## FormControl

A `FormControl` holds a value signal plus state signals like `touched`, `dirty`, `valid`, and `invalid`.

```typescript
import { createFormControl, Validators } from '@melodicdev/core/forms';

const username = createFormControl('', {
	validators: [Validators.required, Validators.minLength(3)],
	updateOn: 'blur'
});

username.value();
username.setValue('melodic');
username.errors();
```

Key APIs:

- `value`: signal for the current value
- `setValue`, `patchValue`, `reset`
- `markAsTouched`, `markAsDirty`, `disable`, `enable`
- `errors`, `valid`, `invalid`, `pending`

## FormGroup

Form groups aggregate multiple controls and compute overall validity.

```typescript
import { createFormGroup, createFormControl, Validators } from '@melodicdev/core/forms';

const form = createFormGroup({
	name: createFormControl('', { validators: [Validators.required] }),
	age: createFormControl<number | null>(null, { validators: [Validators.min(18)] })
});

form.value();
form.valid();
form.get('name').value();
```

Useful APIs:

- `get(name)` to access controls
- `setValue`, `patchValue`, `reset`
- `markAllAsTouched`, `markAllAsDirty`
- `validate` to run validation on all controls

## Validators

Melodic includes a set of built-in validators plus helpers to create custom ones.

```typescript
import { Validators, createValidator } from '@melodicdev/core/forms';

const passwordValidator = createValidator(
	'passwordStrength',
	(value: string) => /[A-Z]/.test(value),
	'Password must include an uppercase letter'
);

const password = createFormControl('', {
	validators: [Validators.required, passwordValidator]
});
```

Built-in validators include:

- `required`
- `minLength`, `maxLength`
- `pattern`, `email`
- `min`, `max`, `range`
- `compose`, `composeAsync`

## FormControl Directive

Bind a `FormControl` to form elements using the `:formControl` attribute directive.

```typescript
import { html } from '@melodicdev/core/template';

html`
	<input type="text" :formControl=${username} />
	<input type="checkbox" :formControl=${acceptedTerms} />
	<select :formControl=${country}>...</select>
`;
```

The directive automatically:

- syncs the element value and control value
- tracks `touched` and `dirty` state
- toggles CSS classes (`mf-valid`, `mf-invalid`, `mf-dirty`, `mf-touched`, etc.)

## Putting It Together

```typescript
import { MelodicComponent } from '@melodicdev/core/components';
import { html } from '@melodicdev/core/template';
import { createFormGroup, createFormControl, Validators } from '@melodicdev/core/forms';

@MelodicComponent({
	selector: 'signup-form',
	template: (self) => html`
		<form @submit=${(event: Event) => self.submit(event)}>
			<input type="text" :formControl=${self.form.get('name')} />
			<input type="email" :formControl=${self.form.get('email')} />
			<button type="submit" .disabled=${self.form.invalid()}>Submit</button>
		</form>
	`
})
export class SignupFormComponent {
	form = createFormGroup({
		name: createFormControl('', { validators: [Validators.required] }),
		email: createFormControl('', { validators: [Validators.email] })
	});

	submit(event: Event): void {
		event.preventDefault();
		this.form.markAllAsTouched();
		if (this.form.valid()) {
			console.log(this.form.value());
		}
	}
}
```
